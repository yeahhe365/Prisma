import React from 'react';

type LogoProps = React.SVGProps<SVGSVGElement>;

const Logo = ({ className = 'w-8 h-8', ...props }: LogoProps) => {
  return (
    <svg viewBox="0 0 600 600" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
      <g id="prism">
        {/* Inner Triangle */}
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M300 180 L200 420 L400 420 Z"
        />

        {/* Connecting Struts */}
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M300 50 L300 180"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M100 480 L200 420"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M500 480 L400 420"
        />

        {/* Outer Triangle */}
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M300 50 L100 480 L500 480 Z"
        />
      </g>

      <g id="beams">
        {/* Input Beam */}
        <line x1="0" y1="275" x2="195" y2="275" stroke="currentColor" strokeWidth="12" />

        {/* Blue Beam */}
        <polyline
          points="194,270 380,225 600,245"
          fill="none"
          stroke="#2563eb"
          strokeWidth="12"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Green Beam */}
        <polyline
          points="194,275 400,275 600,305"
          fill="none"
          stroke="#4ade80"
          strokeWidth="12"
          strokeLinejoin="round"
          opacity="0.95"
        />

        {/* Purple Beam */}
        <polyline
          points="194,280 420,325 600,370"
          fill="none"
          stroke="#9333ea"
          strokeWidth="12"
          strokeLinejoin="round"
          opacity="0.95"
        />
      </g>
    </svg>
  );
};

export default Logo;
