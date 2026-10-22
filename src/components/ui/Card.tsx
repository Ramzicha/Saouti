import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from './Button';
import { Chip } from './Chip';
import { IconCopy, IconEdit, IconRefresh } from '@tabler/icons-react';

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
  imagePrompt?: string;
  onCopy?: () => void;
  onEdit?: () => void;
  onRegenerate?: () => void;
  className?: string;
}

export function PostCard({
  platform,
  status,
  content,
  imagePrompt,
  onCopy,
  onEdit,
  onRegenerate,
  className,
}: PostCardProps) {
  return (
    <Card className={twMerge('flex flex-col gap-3', className)}>
      {/* Header: Platform & status tag */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-sm font-medium text-text">{platform}</span>
        <Chip variant="tag" tagVariant={status}>
          {status === 'ready' ? 'Ready' : 'In review'}
        </Chip>
      </div>

      {/* Body: Preserves line breaks */}
      <div className="whitespace-pre-wrap py-1 text-sm leading-relaxed text-text">
        {content}
      </div>

      {/* Image Prompt: Optional section */}
      {imagePrompt && (
        <div className="border-t border-border pt-2 text-[12.5px] leading-normal text-muted">
          <span className="me-1 font-semibold text-text">Prompt:</span>
          {imagePrompt}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
        {onRegenerate && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onRegenerate}
            aria-label="Regenerate post"
          >
            <IconRefresh size={14} className="me-1.5" aria-hidden="true" />
            Regenerate
          </Button>
        )}
        {onEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onEdit}
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
            aria-label="Copy post"
          >
            <IconCopy size={14} className="me-1.5" aria-hidden="true" />
            Copy
          </Button>
        )}
      </div>
    </Card>
  );
}
