import { db } from '@/lib/db/client';
import { profiles, voiceSamples, platformPreferences } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { QuotaExhaustedError } from '@/lib/ai/errors';
import { buildVoiceProfileSummary } from '@/lib/profile/summary-builder';
import { executeWriterStep, WRITER_PROMPT_VERSION } from './agents/writer';
import { executeCriticStep, CRITIC_PROMPT_VERSION } from './agents/critic';
import { executeArtDirectorStep, ART_DIRECTOR_PROMPT_VERSION } from './agents/art-director';
import { recordAgentStep, updateRunRecord } from './audit';
import { publishRunEvent, isRunCancelled } from './event-stream';
import type { AgentEngineEvent } from './events';
import type { GeneratedPost } from '@/../specs/006-agent-engine/contracts/agent-engine.contract';
import type { CriticScores } from './schemas';
import { autoSaveRunPosts } from '@/lib/library/post-service';

export interface RunOrchestratorOptions {
  runId: string;
  userId: string;
  topicBrief: string;
  selectedPlatforms: Array<'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook'>;
  targetLanguage?: string | undefined;
  arabicDialect?: string | undefined;
  skipCritic?: boolean | undefined;
  onEvent?: ((event: AgentEngineEvent) => void | Promise<void>) | undefined;
  signal?: AbortSignal | undefined;
}

export class RunCancelledException extends Error {
  constructor(message = 'Run was cancelled by user') {
    super(message);
    this.name = 'RunCancelledException';
  }
}

/**
 * Executes the complete multi-agent post generation pipeline.
 */
export async function executeAgentPipeline(options: RunOrchestratorOptions): Promise<{
  posts: GeneratedPost[];
  totalDurationMs: number;
  status: 'completed' | 'cancelled' | 'failed';
}> {
  const {
    runId,
    userId,
    topicBrief,
    selectedPlatforms,
    targetLanguage = 'en',
    arabicDialect = 'none',
    skipCritic = false,
    onEvent,
    signal,
  } = options;

  const startTime = Date.now();

  const emit = async (event: AgentEngineEvent) => {
    try {
      await publishRunEvent(runId, event);
      if (onEvent) {
        await onEvent(event);
      }
    } catch (err) {
      logger.warn({ err, runId, event: event.event }, 'Failed to dispatch pipeline event');
    }
  };

  const checkAbort = async () => {
    if (signal?.aborted || (await isRunCancelled(runId))) {
      throw new RunCancelledException();
    }
  };

  try {
    // 1. Initial State Transition
    await updateRunRecord(runId, { status: 'running' });
    await emit({
      event: 'run.started',
      runId,
      timestamp: new Date().toISOString(),
      selectedPlatforms,
      skipCritic,
    });

    // 2. Fetch User Voice Profile Context
    const [userProfile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    const userSamples = await db
      .select()
      .from(voiceSamples)
      .where(userProfile ? eq(voiceSamples.profileId, userProfile.id) : eq(voiceSamples.id, runId));

    const userPlatforms = await db
      .select()
      .from(platformPreferences)
      .where(userProfile ? eq(platformPreferences.profileId, userProfile.id) : eq(platformPreferences.id, runId));

    const profileSummary = buildVoiceProfileSummary(
      userProfile || {
        role: 'Professional Creator',
        primaryLanguage: targetLanguage,
        arabicDialect,
      },
      userSamples.map((s) => ({
        title: s.title || undefined,
        content: s.content,
        orderIndex: s.orderIndex,
      })),
      userPlatforms.map((p) => ({
        platform: p.platform,
        primaryObjective: p.primaryObjective || undefined,
        subreddits: p.subreddits || undefined,
        customInstructions: p.customInstructions || undefined,
      })),
    );

    const samplesTexts = userSamples.map((s) => s.content);
    const subreddits = userPlatforms
      .find((p) => p.platform === 'reddit')
      ?.subreddits?.map((sub) => ({ name: sub.name, rules: sub.rulesSummary ?? undefined }));

    await checkAbort();

    // 3. STEP 1: WRITER DRAFTING
    const writerStepStart = Date.now();
    const writerStepId =
      (await recordAgentStep({
        runId,
        agentId: 'writer',
        taskLabel: 'Draft initial posts for selected platforms',
        model: 'gemini-2.0-flash',
        promptVersion: WRITER_PROMPT_VERSION,
        status: 'running',
      })) || runId;

    await emit({
      event: 'agent.started',
      runId,
      timestamp: new Date().toISOString(),
      agent: 'writer',
      action: 'Drafting platform-native versions',
      stepId: writerStepId,
    });

    const writerOutput = await executeWriterStep({
      userId,
      profileSummary,
      samples: samplesTexts,
      platforms: selectedPlatforms,
      subreddits,
      brief: topicBrief,
      signal,
    });

    const writerDurationSec = Math.max(1, Math.round((Date.now() - writerStepStart) / 1000));
    await recordAgentStep({
      runId,
      agentId: 'writer',
      taskLabel: 'Draft initial posts for selected platforms',
      model: 'gemini-2.0-flash',
      promptVersion: WRITER_PROMPT_VERSION,
      status: 'completed',
      durationMs: Date.now() - writerStepStart,
      outputPayload: writerOutput as unknown as Record<string, unknown>,
    });

    await emit({
      event: 'agent.completed',
      runId,
      timestamp: new Date().toISOString(),
      agent: 'writer',
      durationSeconds: writerDurationSec,
      statusText: `Drafted ${writerOutput.posts.length} platform versions`,
    });

    await checkAbort();

    let activePosts = [...writerOutput.posts];
    const criticScoresByPlatform: Record<string, CriticScores> = {};
    const criticIssuesByPlatform: Record<
      string,
      Array<{ exactPhrase: string; problem: string; suggestedFix: string }>
    > = {};
    const criticVerdictsByPlatform: Record<string, 'pass' | 'revise'> = {};

    // 4. STEP 2: CRITIC REVIEW (OR SKIP CRITIC)
    if (skipCritic) {
      await emit({
        event: 'agent.handoff',
        runId,
        timestamp: new Date().toISOString(),
        fromAgent: 'writer',
        toAgent: 'art',
        reason: 'Fast Draft requested - skipping Critic review',
      });
    } else {
      const criticStepStart = Date.now();
      const criticStepId =
        (await recordAgentStep({
          runId,
          agentId: 'critic',
          taskLabel: 'Evaluate posts against voice, safety, and platforms',
          model: 'gemini-2.0-flash',
          promptVersion: CRITIC_PROMPT_VERSION,
          status: 'running',
        })) || runId;

      await emit({
        event: 'agent.started',
        runId,
        timestamp: new Date().toISOString(),
        agent: 'critic',
        action: 'Evaluating voice authenticity and safety',
        stepId: criticStepId,
      });

      const criticResult = await executeCriticStep({
        userId,
        profileSummary,
        samples: samplesTexts,
        platforms: selectedPlatforms,
        brief: topicBrief,
        draftedPosts: activePosts,
        signal,
      });

      for (const ev of criticResult.evaluations) {
        criticScoresByPlatform[ev.platform] = ev.scores;
        criticIssuesByPlatform[ev.platform] = ev.issues;
        criticVerdictsByPlatform[ev.platform] = ev.verdict;
      }

      const criticDurationSec = Math.max(1, Math.round((Date.now() - criticStepStart) / 1000));
      await recordAgentStep({
        runId,
        agentId: 'critic',
        taskLabel: 'Evaluate posts against voice, safety, and platforms',
        model: 'gemini-2.0-flash',
        promptVersion: CRITIC_PROMPT_VERSION,
        status: 'completed',
        durationMs: Date.now() - criticStepStart,
        outputPayload: criticResult as unknown as Record<string, unknown>,
      });

      await emit({
        event: 'agent.completed',
        runId,
        timestamp: new Date().toISOString(),
        agent: 'critic',
        durationSeconds: criticDurationSec,
        statusText:
          criticResult.overallVerdict === 'pass'
            ? 'All drafts passed quality criteria'
            : 'Revisions requested for quality alignment',
      });

      await checkAbort();

      // 5. STEP 3: OPTIONAL 1-LOOP REVISION
      if (criticResult.overallVerdict === 'revise') {
        const allIssues = criticResult.evaluations.flatMap((ev) =>
          ev.issues.map((i) => ({ platform: ev.platform, ...i })),
        );

        await emit({
          event: 'agent.handoff',
          runId,
          timestamp: new Date().toISOString(),
          fromAgent: 'critic',
          toAgent: 'writer',
          reason: `Critic requested revisions on ${allIssues.length} issue(s)`,
          issues: allIssues,
        });

        const revisionStepStart = Date.now();
        await recordAgentStep({
          runId,
          agentId: 'writer',
          taskLabel: 'Revise posts based on Critic feedback',
          model: 'gemini-2.0-flash',
          promptVersion: WRITER_PROMPT_VERSION,
          status: 'running',
        });

        await emit({
          event: 'agent.started',
          runId,
          timestamp: new Date().toISOString(),
          agent: 'writer',
          action: 'Refining drafts based on critic feedback',
          stepId: `${runId}-revision`,
        });

        const revisedOutput = await executeWriterStep({
          userId,
          profileSummary,
          samples: samplesTexts,
          platforms: selectedPlatforms,
          subreddits,
          brief: topicBrief,
          draftedPosts: activePosts,
          revisionNotes: allIssues.map((i) => ({
            exactPhrase: i.exactPhrase,
            problem: i.problem,
            suggestedFix: i.suggestedFix,
          })),
          signal,
        });

        activePosts = [...revisedOutput.posts];

        const revisionDurationSec = Math.max(1, Math.round((Date.now() - revisionStepStart) / 1000));
        await recordAgentStep({
          runId,
          agentId: 'writer',
          taskLabel: 'Revise posts based on Critic feedback',
          model: 'gemini-2.0-flash',
          promptVersion: WRITER_PROMPT_VERSION,
          status: 'completed',
          durationMs: Date.now() - revisionStepStart,
          outputPayload: revisedOutput as unknown as Record<string, unknown>,
        });

        await emit({
          event: 'agent.completed',
          runId,
          timestamp: new Date().toISOString(),
          agent: 'writer',
          durationSeconds: revisionDurationSec,
          statusText: 'Revisions completed',
        });

        await checkAbort();
      }

      await emit({
        event: 'agent.handoff',
        runId,
        timestamp: new Date().toISOString(),
        fromAgent: 'critic',
        toAgent: 'art',
        reason: 'Handing off to Art Director for visual direction',
      });
    }

    // 6. STEP 4: ART DIRECTOR
    const artStepStart = Date.now();
    const artStepId =
      (await recordAgentStep({
        runId,
        agentId: 'art_director',
        taskLabel: 'Formulate visual prompts and alt text',
        model: 'gemini-2.0-flash',
        promptVersion: ART_DIRECTOR_PROMPT_VERSION,
        status: 'running',
      })) || runId;

    await emit({
      event: 'agent.started',
      runId,
      timestamp: new Date().toISOString(),
      agent: 'art',
      action: 'Designing visual concepts and alt text',
      stepId: artStepId,
    });

    const artOutput = await executeArtDirectorStep({
      userId,
      profileSummary,
      platforms: selectedPlatforms,
      brief: topicBrief,
      approvedPosts: activePosts,
      signal,
    });

    const artVisualsByPlatform = Object.fromEntries(
      artOutput.visuals.map((v) => [v.platform, v]),
    );

    const artDurationSec = Math.max(1, Math.round((Date.now() - artStepStart) / 1000));
    await recordAgentStep({
      runId,
      agentId: 'art_director',
      taskLabel: 'Formulate visual prompts and alt text',
      model: 'gemini-2.0-flash',
      promptVersion: ART_DIRECTOR_PROMPT_VERSION,
      status: 'completed',
      durationMs: Date.now() - artStepStart,
      outputPayload: artOutput as unknown as Record<string, unknown>,
    });

    await emit({
      event: 'agent.completed',
      runId,
      timestamp: new Date().toISOString(),
      agent: 'art',
      durationSeconds: artDurationSec,
      statusText: `Generated ${artOutput.visuals.length} visual concepts`,
    });

    // 7. Assemble Final Posts
    const finalPosts: GeneratedPost[] = activePosts.map((post) => {
      const art = artVisualsByPlatform[post.platform];
      return {
        platform: post.platform as 'linkedin' | 'instagram' | 'reddit' | 'x' | 'facebook',
        language: post.language,
        text: post.text,
        hashtags: post.hashtags || [],
        imagePrompt: art?.prompt,
        imageAltText: art?.altText,
        imageAspectRatio: art?.aspectRatio,
        criticVerdict: criticVerdictsByPlatform[post.platform],
        criticScores: criticScoresByPlatform[post.platform],
        criticIssues: criticIssuesByPlatform[post.platform],
      };
    });

    const totalDurationMs = Date.now() - startTime;
    await updateRunRecord(runId, {
      status: 'completed',
      posts: finalPosts,
      totalDurationMs,
    });

    try {
      await autoSaveRunPosts({
        userId,
        runId,
        posts: finalPosts,
      });
    } catch (saveError) {
      logger.error({ err: saveError, runId }, 'Failed to auto-save generated posts to library');
    }

    await emit({
      event: 'run.completed',
      runId,
      timestamp: new Date().toISOString(),
      totalDurationSeconds: Math.max(1, Math.round(totalDurationMs / 1000)),
      postCount: finalPosts.length,
    });

    return {
      posts: finalPosts,
      totalDurationMs,
      status: 'completed',
    };
  } catch (error) {
    const totalDurationMs = Date.now() - startTime;

    if (error instanceof RunCancelledException) {
      await updateRunRecord(runId, {
        status: 'cancelled',
        totalDurationMs,
      });

      await emit({
        event: 'run.cancelled',
        runId,
        timestamp: new Date().toISOString(),
        reason: 'User cancelled run execution',
      });

      return {
        posts: [],
        totalDurationMs,
        status: 'cancelled',
      };
    }

    const isQuota = error instanceof QuotaExhaustedError;
    const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';

    await updateRunRecord(runId, {
      status: 'failed',
      totalDurationMs,
      errorMessage,
    });

    await emit({
      event: 'agent.error',
      runId,
      timestamp: new Date().toISOString(),
      errorCode: isQuota ? 'QUOTA_EXHAUSTED' : 'PIPELINE_ERROR',
      message: errorMessage,
      isRateLimit: isQuota,
      retryCountdownSeconds: isQuota ? 30 : undefined,
    });

    return {
      posts: [],
      totalDurationMs,
      status: 'failed',
    };
  }
}
