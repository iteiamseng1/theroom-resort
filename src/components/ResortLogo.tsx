"use client";

import { useId } from "react";

export function ResortLogo({ className = "w-36 h-auto" }: { className?: string }) {
  const gradId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 240 140"
      className={className}
      aria-label="The Room Resort ชุมแพ"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E4C165" />
          <stop offset="50%" stopColor="#C89B35" />
          <stop offset="100%" stopColor="#9E731A" />
        </linearGradient>
      </defs>
      <rect
        width="240"
        height="140"
        rx="16"
        fill="#FAF5EE"
        stroke={`url(#${gradId})`}
        strokeWidth="3"
      />
      <path
        d="M98 35 L165 8 L222 37"
        fill="none"
        stroke="#4A2511"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="208"
        y1="32"
        x2="208"
        y2="51"
        stroke="#4A2511"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <rect x="155" y="23" width="7" height="7" rx="1" fill={`url(#${gradId})`} />
      <rect x="165" y="23" width="7" height="7" rx="1" fill={`url(#${gradId})`} />
      <rect x="155" y="33" width="7" height="7" rx="1" fill={`url(#${gradId})`} />
      <rect x="165" y="33" width="7" height="7" rx="1" fill={`url(#${gradId})`} />
      <text x="52" y="38" fontFamily="Georgia, serif" fontSize="22" fontWeight="bold" fill="#4A2511">
        The
      </text>
      <text
        x="120"
        y="78"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="44"
        fontWeight="bold"
        fill="#8B1515"
      >
        Room
      </text>
      <line
        x1="20"
        y1="97"
        x2="68"
        y2="97"
        stroke={`url(#${gradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <text
        x="120"
        y="103"
        textAnchor="middle"
        fontFamily="Georgia, serif"
        fontSize="18"
        letterSpacing="2"
        fill="#4A2511"
      >
        Resort
      </text>
      <line
        x1="172"
        y1="97"
        x2="220"
        y2="97"
        stroke={`url(#${gradId})`}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="64" y="110" width="112" height="23" rx="11.5" fill={`url(#${gradId})`} />
      <text
        x="120"
        y="126"
        textAnchor="middle"
        fontFamily="sans-serif"
        fontSize="12"
        fontWeight="bold"
        fill="#2D160B"
      >
        ชุมแพ
      </text>
    </svg>
  );
}
