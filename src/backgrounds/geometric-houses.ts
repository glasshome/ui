/* The wallpaper both apps render. Motion lives on an inner .house-pop group gated by
 * html[data-motion], so the entrance plays inside the motion window and nothing animates after it.
 * Written by hand once; keep the copy here and nowhere else. */
export const GEOMETRIC_HOUSES_SVG = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
  <style>
    .house-shape { opacity: 0.9; filter: blur(0.2px); transform: translate(var(--tx), var(--ty)) rotate(var(--rot)); }

    @keyframes pop {
      0%   { transform: scale(0.88); opacity: 0; }
      100% { transform: scale(1); opacity: 1; }
    }

    .h1 { --tx: 12px; --ty: 20px; --rot: 12deg; }
    .h1 .house-pop { animation: pop 2.2s cubic-bezier(0.16, 1, 0.3, 1) 0.10s; }
    .h2 { --tx: 85px; --ty: 25px; --rot: -15deg; }
    .h2 .house-pop { animation: pop 2.2s cubic-bezier(0.16, 1, 0.3, 1) 0.40s; }
    .h3 { --tx: 15px; --ty: 75px; --rot: -8deg; }
    .h3 .house-pop { animation: pop 2.2s cubic-bezier(0.16, 1, 0.3, 1) 0.70s; }
    .h4 { --tx: 70px; --ty: 10px; --rot: 20deg; }
    .h4 .house-pop { animation: pop 2.2s cubic-bezier(0.16, 1, 0.3, 1) 1.00s; }
    .h5 { --tx: 35px; --ty: 8px; --rot: -25deg; }
    .h5 .house-pop { animation: pop 2.2s cubic-bezier(0.16, 1, 0.3, 1) 1.30s; }
    .h6 { --tx: 55px; --ty: 55px; --rot: 18deg; }
    .h6 .house-pop { animation: pop 2.2s cubic-bezier(0.16, 1, 0.3, 1) 1.60s; }

    .house-shape .house-pop { animation-play-state: paused; }
    [data-motion="live"] .house-shape .house-pop { animation-play-state: running; }
    [data-motion="still"] .house-shape .house-pop { animation-play-state: paused; }

    @media (prefers-reduced-motion: reduce) {
      .house-pop { animation: none; }
    }
  </style>

  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--primary, oklch(0.48 0.2 215.221));stop-opacity:0.28" />
      <stop offset="100%" style="stop-color:var(--accent, oklch(0.6 0.2 195));stop-opacity:0.06" />
    </linearGradient>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--accent, oklch(0.6 0.2 195));stop-opacity:0.30" />
      <stop offset="100%" style="stop-color:var(--secondary, oklch(0.11 0.003 0));stop-opacity:0.08" />
    </linearGradient>
    <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--primary, oklch(0.48 0.2 215.221));stop-opacity:0.35" />
      <stop offset="100%" style="stop-color:var(--accent, oklch(0.6 0.2 195));stop-opacity:0.10" />
    </linearGradient>
    <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--secondary, oklch(0.11 0.003 0));stop-opacity:0.22" />
      <stop offset="100%" style="stop-color:var(--primary, oklch(0.48 0.2 215.221));stop-opacity:0.04" />
    </linearGradient>
    <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--accent, oklch(0.6 0.2 195));stop-opacity:0.25" />
      <stop offset="100%" style="stop-color:var(--primary, oklch(0.48 0.2 215.221));stop-opacity:0.05" />
    </linearGradient>
    <linearGradient id="grad6" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:var(--primary, oklch(0.48 0.2 215.221));stop-opacity:0.32" />
      <stop offset="100%" style="stop-color:var(--secondary, oklch(0.11 0.003 0));stop-opacity:0.07" />
    </linearGradient>
    <linearGradient id="overlay" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:var(--primary, oklch(0.48 0.2 215.221));stop-opacity:0.20" />
      <stop offset="50%" style="stop-color:transparent;stop-opacity:0" />
      <stop offset="100%" style="stop-color:var(--accent, oklch(0.6 0.2 195));stop-opacity:0.40" />
    </linearGradient>

    <path id="house" d="M 50,4 C 52,4 53.5,4.7 54.5,6 L 86,38 C 88.8,40.2 90,43 90,46 L 90,90 C 90,93.8 87.8,96 84,96 L 16,96 C 12.2,96 10,93.8 10,90 L 10,46 C 10,43 11.2,40.2 14,38 L 45.5,6 C 46.5,4.7 48,4 50,4 Z"/>
  </defs>

  <rect width="100%" height="100%" fill="var(--background, oklch(0.12 0.005 0))"/>

  <g class="house-shape h1">
    <g class="house-pop">
      <use href="#house" transform="translate(-15, -15) scale(0.31)" fill="url(#grad1)" stroke="var(--primary, oklch(0.48 0.2 215.221))" stroke-opacity="0.35" stroke-width="0.5"/>
    </g>
  </g>
  <g class="house-shape h2">
    <g class="house-pop">
      <use href="#house" transform="translate(-13, -12) scale(0.26)" fill="url(#grad2)" stroke="var(--accent, oklch(0.6 0.2 195))" stroke-opacity="0.40" stroke-width="0.5"/>
    </g>
  </g>
  <g class="house-shape h3">
    <g class="house-pop">
      <use href="#house" transform="translate(-8, -8) scale(0.16)" fill="url(#grad3)" stroke="var(--primary, oklch(0.48 0.2 215.221))" stroke-opacity="0.45" stroke-width="0.5"/>
    </g>
  </g>
  <g class="house-shape h4">
    <g class="house-pop">
      <use href="#house" transform="translate(-5, -5) scale(0.10)" fill="url(#grad4)" stroke="var(--secondary, oklch(0.11 0.003 0))" stroke-opacity="0.28" stroke-width="0.5"/>
    </g>
  </g>
  <g class="house-shape h5">
    <g class="house-pop">
      <use href="#house" transform="translate(-4, -4) scale(0.08)" fill="url(#grad5)" stroke="var(--accent, oklch(0.6 0.2 195))" stroke-opacity="0.32" stroke-width="0.5"/>
    </g>
  </g>
  <g class="house-shape h6">
    <g class="house-pop">
      <use href="#house" transform="translate(-9.5, -9.5) scale(0.19)" fill="url(#grad6)" stroke="var(--primary, oklch(0.48 0.2 215.221))" stroke-opacity="0.38" stroke-width="0.5"/>
    </g>
  </g>

  <rect width="100%" height="100%" fill="url(#overlay)" pointer-events="none"/>
</svg>`;
