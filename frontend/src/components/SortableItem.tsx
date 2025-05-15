import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  isDraggingEnabled?: boolean;
}

export function SortableItem({ id, children, isDraggingEnabled = false }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: !isDraggingEnabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: 'relative' as const,
    cursor: isDraggingEnabled ? 'grab' : 'default',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-item"
      {...(isDraggingEnabled ? { ...attributes, ...listeners } : {})}
    >
      {children}
    </div>
  );
}