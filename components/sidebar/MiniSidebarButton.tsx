import React from 'react';
import { SIDEBAR_ICON_BUTTON_CLASS } from '@/components/sidebar/sidebarConstants';

const MiniSidebarButton = ({
  onClick,
  icon: Icon,
  title,
  testId,
  className = '',
}: {
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  testId?: string;
  className?: string;
}) => (
  <button
    type="button"
    onClick={(event) => {
      event.stopPropagation();
      onClick();
    }}
    className={[SIDEBAR_ICON_BUTTON_CLASS, 'cursor-pointer', className].filter(Boolean).join(' ')}
    title={title}
    aria-label={title}
    data-testid={testId}
  >
    <Icon size={20} strokeWidth={2} />
  </button>
);

export default MiniSidebarButton;
