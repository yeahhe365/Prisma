const SidebarToggleIcon = ({
  size = 20,
  strokeWidth = 2,
  className,
  color = 'currentColor',
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
  color?: string;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" x2="20" y1="8" y2="8" />
    <line x1="4" x2="14" y1="16" y2="16" />
  </svg>
);

export default SidebarToggleIcon;
