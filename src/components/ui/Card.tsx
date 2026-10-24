import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from './Button';
import { Chip } from './Chip';
import {
  IconCopy,
  IconEdit,
  IconRefresh,
  IconCheck,
  IconX,
  IconLoader2,
  IconBookmark,
  IconBookmarkFilled,
} from '@tabler/icons-react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  children: React.ReactNode;
}

export function Card({
  raised = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-card border border-border p-4 transition-colors',
          raised ? 'bg-surface-raised' : 'bg-surface',
          className,
        ),
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export interface PostCardProps {
  platform: string;
  status: 'ready' | 'in_review';
  content: string;
  imagePrompt?: string | undefined;
  onCopy?: (() => void) | undefined;
  onEdit?: (() => void) | undefined;
  onSaveContent?: ((newContent: string) => void) | undefined;
  onRegenerate?: (() => void) | undefined;
  isRegenerating?: boolean | undefined;
  onSaveToLibrary?: (() => void) | undefined;
  isSaved?: boolean | undefined;
  isSaving?: boolean | undefined;
  className?: string | undefined;
}

export function PostCard({
  platform,
  status,
  content,
  imagePrompt,
  onCopy,
  onEdit,
  onSaveContent,
  onRegenerate,
  isRegenerating = false,
  onSaveToLibrary,
  isSaved = false,
  isSaving = false,
  className,
}: PostCardProps) {

  const [isEditing, setIsEditing] = React.useState(false);
  const [editedContent, setEditedContent] = React.useState(content);
  const [copiedPrompt, setCopiedPrompt] = React.useState(false);

  React.useEffect(() => {
    setEditedContent(content);
  }, [content]);

  const handleStartEdit = () => {
    setIsEditing(true);
    onEdit?.();
  };

  const handleSave = () => {
    setIsEditing(false);
    onSaveContent?.(editedContent);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(content);
  };

  return (
    <Card className={twMerge('flex flex-col gap-3', className)}>
      {/* Header: Platform & status tag */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-sm font-semibold text-text capitalize">{platform}</span>
        <div className="flex items-center gap-2">
          {isEditing && (
            <span className="text-[11px] font-medium text-accent">Editing</span>
          )}
          <Chip variant="tag" tagVariant={status}>
            {status === 'ready' ? 'Ready' : 'In review'}
          </Chip>
        </div>
      </div>

      {/* Body: Preserves line breaks OR inline editor */}
      {isEditing ? (
        <div className="flex flex-col gap-2 py-1">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={6}
            dir="auto"
            className="w-full resize-y rounded-lg border border-border bg-surface-raised p-3 text-sm leading-relaxed text-text placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            autoFocus
          />
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>{editedContent.length} characters</span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCancel}
                aria-label="Cancel editing"
              >
                <IconX size={14} className="me-1" aria-hidden="true" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                aria-label="Save changes"
              >
                <IconCheck size={14} className="me-1" aria-hidden="true" />
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="whitespace-pre-wrap py-1 text-sm leading-relaxed text-text">
          {content}
        </div>
      )}

      {/* Image Prompt: Optional section */}
      {imagePrompt && !isEditing && (
        <div className="border-t border-border pt-2 text-[12.5px] leading-normal text-muted flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className="me-1 font-semibold text-text">Visual Concept:</span>
            {imagePrompt}
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(imagePrompt);
                setCopiedPrompt(true);
                setTimeout(() => setCopiedPrompt(false), 2000);
              } catch {
                // Fallback
              }
            }}
            title="Copy visual concept prompt"
            aria-label="Copy visual concept prompt"
            className="shrink-0 p-1 rounded hover:bg-surface-elevated text-muted hover:text-text transition-colors mt-0.5"
          >
            {copiedPrompt ? (
              <IconCheck size={14} className="text-emerald-500" />
            ) : (
              <IconCopy size={14} />
            )}
          </button>
        </div>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
          {onRegenerate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRegenerate}
              disabled={isRegenerating}
              aria-label="Regenerate post"
            >
              {isRegenerating ? (
                <IconLoader2 size={14} className="me-1.5 animate-spin" aria-hidden="true" />
              ) : (
                <IconRefresh size={14} className="me-1.5" aria-hidden="true" />
              )}
              {isRegenerating ? 'Drafting...' : 'Regenerate'}
            </Button>
          )}
          {onSaveToLibrary && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onSaveToLibrary}
              disabled={isSaved || isSaving || isRegenerating}
              className={
                isSaved
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                  : 'hover:border-primary-500/50'
              }
              aria-label={isSaved ? 'Saved to library' : 'Save to library'}
            >
              {isSaving ? (
                <IconLoader2 size={14} className="me-1.5 animate-spin" aria-hidden="true" />
              ) : isSaved ? (
                <IconBookmarkFilled size={14} className="me-1.5 text-emerald-500" aria-hidden="true" />
              ) : (
                <IconBookmark size={14} className="me-1.5 text-primary-500" aria-hidden="true" />
              )}
              {isSaving ? 'Saving...' : isSaved ? 'Saved to Library' : 'Save to Library'}
            </Button>
          )}
          {(onEdit || onSaveContent) && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleStartEdit}
              disabled={isRegenerating}
              aria-label="Edit post"
            >
              <IconEdit size={14} className="me-1.5" aria-hidden="true" />
              Edit
            </Button>
          )}
          {onCopy && (
            <Button
              variant="primary"
              size="sm"
              onClick={onCopy}
              disabled={isRegenerating}
              aria-label="Copy post"
            >
              <IconCopy size={14} className="me-1.5" aria-hidden="true" />
              Copy
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

