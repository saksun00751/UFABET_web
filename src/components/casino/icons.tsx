import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;

export const CrownIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" />
  </svg>
);
export const SpadeIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 2C8 7 3 9.5 3 14a4.5 4.5 0 0 0 8 2.8L10 22h4l-1-5.2A4.5 4.5 0 0 0 21 14c0-4.5-5-7-9-12z" />
  </svg>
);
export const DiamondIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 2 20 12 12 22 4 12z" />
  </svg>
);
export const ClubIcon = (p: P) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="7" r="4" />
    <circle cx="7" cy="13" r="4" />
    <circle cx="17" cy="13" r="4" />
    <path d="M11 13h2l1 9h-4z" />
  </svg>
);
export const HeartIcon = (p: P) => (
  <svg {...base} {...p}>
    <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" />
  </svg>
);
