'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  IconPin,
  IconPinnedOff,
  IconPlus,
  IconEdit,
  IconTrash,
  IconFlame,
} from '@tabler/icons-react';
import type { Topic } from '@/lib/db/schema';

interface TopicChipsBarProps {
  topics: Topic[];
  activeTopicId: string | null;
  onSelectTopic: (topic: Topic | null) => void;
  onAddTopicClick: () => void;
  onEditTopic: (topic: Topic) => void;
  onTogglePin: (topic: Topic) => void;
  onDeleteTopic: (topic: Topic) => void;
}

export function TopicChipsBar({
  topics,
  activeTopicId,
  onSelectTopic,
  onAddTopicClick,
  onEditTopic,
  onTogglePin,
  onDeleteTopic,
}: TopicChipsBarProps) {
  const t = useTranslations('Explore');

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('topicsTitle')}
        </span>
        <button
          type="button"
          onClick={onAddTopicClick}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors rounded-md px-1 py-0.5"
        >
          <IconPlus className="w-3.5 h-3.5" />
          <span>{t('addTopic')}</span>
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {/* All / Overview Chip */}
        <button
          type="button"
          onClick={() => onSelectTopic(null)}
          className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
            activeTopicId === null
              ? 'bg-button text-on-button border-button font-semibold shadow-xs'
              : 'bg-surface text-foreground/80 border-border hover:bg-surface-raised hover:text-foreground'
          }`}
        >
          <span>All Topics</span>
        </button>

        {/* User Topic Chips */}
        {topics.map((topic) => {
          const isActive = activeTopicId === topic.id;
          return (
            <div
              key={topic.id}
              className={`group shrink-0 inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-medium border transition-all ${
                isActive
                  ? 'bg-button text-on-button border-button font-semibold shadow-xs'
                  : 'bg-surface text-foreground/85 border-border hover:bg-surface-raised hover:text-foreground'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectTopic(topic)}
                className="flex items-center gap-1.5 focus:outline-none"
              >
                {topic.isPinned && (
                  <IconPin
                    className={`w-3 h-3 shrink-0 ${
                      isActive ? 'text-on-button' : 'text-muted-foreground'
                    }`}
                  />
                )}
                <span className="max-w-[200px] truncate">{topic.phrase}</span>
              </button>

              {/* Hover actions */}
              <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(topic);
                  }}
                  title={topic.isPinned ? t('unpinTopic') : t('pinTopic')}
                  className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${
                    isActive ? 'text-on-button/80' : 'text-muted-foreground'
                  }`}
                >
                  {topic.isPinned ? (
                    <IconPinnedOff className="w-3 h-3" />
                  ) : (
                    <IconPin className="w-3 h-3" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditTopic(topic);
                  }}
                  title={t('editTopic')}
                  className={`p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 ${
                    isActive ? 'text-on-button/80' : 'text-muted-foreground'
                  }`}
                >
                  <IconEdit className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTopic(topic);
                  }}
                  title={t('removeTopic')}
                  className={`p-0.5 rounded hover:bg-destructive/20 text-destructive`}
                >
                  <IconTrash className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
