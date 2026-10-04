"use client";

import { useId } from "react";

interface PaperPlaneIconProps {
  className?: string;
}

/**
 * A hand-sketched paper plane in pastel crayon tones, nose pointing along
 * +x at zero rotation, so it drops straight into the flight path's
 * atan2-based rotation with no extra offset. A simple wide dart/kite
 * silhouette (the classic paper-plane top-view shape) reads clearly at
 * small sizes; a real feTurbulence/feDisplacementMap filter roughens every
 * edge so it still looks drawn rather than a clean vector shape.
 */
export function PaperPlaneIcon({ className = "" }: PaperPlaneIconProps) {
  const filterId = useId();

  return (
    <svg viewBox="0 0 100 40" className={className} aria-hidden="true">
      <defs>
        <filter id={filterId} x="-20%" y="-40%" width="140%" height="180%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.09"
            numOctaves={2}
            seed={5}
            result="wobble"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="wobble"
            scale={1.9}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
      <g filter={`url(#${filterId})`}>
        <polygon
          points="98,20 35,3 58,20 35,37"
          fill="#f8caa0"
          stroke="#b8622f"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <polygon points="98,20 58,20 35,37" fill="#b8622f" fillOpacity="0.3" />
        <path
          d="M96,20 L60,20"
          fill="none"
          stroke="#8a4a24"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>
    </svg>
  );
}
