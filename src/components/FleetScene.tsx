export type SceneName = "highway" | "warehouse";

/**
 * Branded vector illustrations used as the fleet imagery on the home page.
 * Self-contained (no external assets) so they always render. To swap in a real
 * photograph, pass a `src` to <PhotoSlot> — these are the fallback.
 */
export default function FleetScene({ scene }: { scene: SceneName }) {
  return scene === "warehouse" ? <Warehouse /> : <Highway />;
}

/** Semi-truck on an open highway at golden hour — hero imagery. */
function Highway() {
  return (
    <svg
      viewBox="0 0 640 460"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      role="img"
      aria-label="Caminhão da frota Astro Fretes em rodovia"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A0B73" />
          <stop offset="0.55" stopColor="#6B23B0" />
          <stop offset="1" stopColor="#9B5FD9" />
        </linearGradient>
        <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2A2440" />
          <stop offset="1" stopColor="#1C1830" />
        </linearGradient>
        <linearGradient id="cab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E6DAF6" />
        </linearGradient>
      </defs>

      {/* sky + sun */}
      <rect width="640" height="460" fill="url(#sky)" />
      <circle cx="470" cy="150" r="86" fill="#FFD8A8" opacity="0.9" />
      <circle cx="470" cy="150" r="120" fill="#FFD8A8" opacity="0.18" />

      {/* distant hills */}
      <path d="M0 250 Q160 196 330 246 T640 234 V300 H0 Z" fill="#5A2A9C" opacity="0.55" />
      <path d="M0 280 Q200 232 410 280 T640 266 V320 H0 Z" fill="#4A1E86" opacity="0.6" />

      {/* clouds */}
      <g fill="#FFFFFF" opacity="0.14">
        <ellipse cx="150" cy="120" rx="60" ry="17" />
        <ellipse cx="250" cy="98" rx="44" ry="13" />
        <ellipse cx="560" cy="86" rx="52" ry="15" />
      </g>

      {/* road */}
      <rect y="300" width="640" height="160" fill="url(#road)" />
      <path d="M120 460 L300 312 H360 L300 460 Z" fill="#FFFFFF" opacity="0.06" />
      {/* lane dashes */}
      <g fill="#F4C04E">
        <path d="M300 330 l16 0 -4 22 -16 0 z" />
        <path d="M292 372 l22 0 -6 30 -22 0 z" />
        <path d="M280 422 l30 0 -10 38 -32 0 z" />
      </g>

      {/* truck */}
      <g transform="translate(96 196)">
        {/* trailer */}
        <rect x="150" y="40" width="250" height="118" rx="10" fill="#F1EAFB" />
        <rect x="150" y="40" width="250" height="118" rx="10" fill="none" stroke="#C9B6E8" strokeWidth="2" />
        <rect x="168" y="58" width="214" height="82" rx="6" fill="#FFFFFF" />
        {/* brand mark on the trailer */}
        <g transform="translate(228 76)">
          <path
            d="M24 2 L44 13 V35 L24 46 L4 35 V13 Z"
            fill="none"
            stroke="#7B2FBE"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path d="M4.6 14 L24 25 L43.4 14 M24 25 V46" fill="none" stroke="#7B2FBE" strokeWidth="3.4" strokeLinejoin="round" />
        </g>
        {/* cab */}
        <path
          d="M400 70 h54 q22 0 30 22 l12 34 q4 12 4 22 v10 h-100 Z"
          fill="url(#cab)"
        />
        <path d="M404 78 h44 q14 0 20 16 l9 26 h-73 Z" fill="#B9E0F2" />
        <rect x="396" y="150" width="108" height="8" rx="4" fill="#2A2440" />
        {/* bumper / grille */}
        <rect x="492" y="120" width="14" height="34" rx="4" fill="#4A0E8F" />

        {/* wheels */}
        <g>
          <circle cx="210" cy="160" r="26" fill="#1B1726" />
          <circle cx="210" cy="160" r="11" fill="#9B5FD9" />
          <circle cx="270" cy="160" r="26" fill="#1B1726" />
          <circle cx="270" cy="160" r="11" fill="#9B5FD9" />
          <circle cx="452" cy="160" r="26" fill="#1B1726" />
          <circle cx="452" cy="160" r="11" fill="#9B5FD9" />
        </g>

        {/* motion lines */}
        <g stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" opacity="0.5">
          <path d="M-6 70 h54" />
          <path d="M-22 96 h78" />
          <path d="M-6 122 h44" />
        </g>
      </g>
    </svg>
  );
}

/** Distribution center with a truck at the loading dock — company section. */
function Warehouse() {
  return (
    <svg
      viewBox="0 0 560 440"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      role="img"
      aria-label="Centro de distribuição da Astro Fretes"
    >
      <defs>
        <linearGradient id="wsky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A1A8C" />
          <stop offset="1" stopColor="#7B2FBE" />
        </linearGradient>
        <linearGradient id="wbody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#EFE6FA" />
        </linearGradient>
      </defs>

      <rect width="560" height="440" fill="url(#wsky)" />
      <circle cx="120" cy="96" r="60" fill="#FFFFFF" opacity="0.12" />

      {/* ground */}
      <rect y="320" width="560" height="120" fill="#2A2440" />
      <rect y="320" width="560" height="10" fill="#1C1830" />

      {/* warehouse building */}
      <g>
        <rect x="60" y="150" width="320" height="172" fill="url(#wbody)" />
        {/* saw-tooth roof */}
        <path d="M60 150 l40 -34 40 34 40 -34 40 34 40 -34 40 34 40 -34 40 34 Z" fill="#E0D2F4" />
        <path d="M60 150 l40 -34 40 34 40 -34 40 34 40 -34 40 34 40 -34 40 34" fill="none" stroke="#C2ABE6" strokeWidth="2" />
        {/* dock doors */}
        <g>
          <rect x="86" y="208" width="68" height="114" rx="4" fill="#D7C7F0" />
          <rect x="92" y="216" width="56" height="98" rx="3" fill="#B89BE0" />
          <rect x="176" y="208" width="68" height="114" rx="4" fill="#D7C7F0" />
          <rect x="182" y="216" width="56" height="98" rx="3" fill="#B89BE0" />
        </g>
        {/* signage band */}
        <rect x="262" y="196" width="100" height="30" rx="6" fill="#4A0E8F" />
        <rect x="272" y="207" width="58" height="8" rx="4" fill="#C9A8F0" />
        {/* windows */}
        <g fill="#9B5FD9">
          <rect x="262" y="244" width="22" height="22" rx="3" />
          <rect x="294" y="244" width="22" height="22" rx="3" />
          <rect x="326" y="244" width="22" height="22" rx="3" />
        </g>
      </g>

      {/* delivery truck at the dock */}
      <g transform="translate(360 214)">
        <rect x="0" y="20" width="118" height="86" rx="8" fill="#F1EAFB" stroke="#C9B6E8" strokeWidth="2" />
        <path d="M118 44 h28 q14 0 18 14 l8 24 v24 h-54 Z" fill="#FFFFFF" stroke="#C9B6E8" strokeWidth="2" />
        <rect x="122" y="50" width="30" height="22" rx="3" fill="#B9E0F2" />
        <circle cx="34" cy="108" r="18" fill="#1B1726" />
        <circle cx="34" cy="108" r="7" fill="#9B5FD9" />
        <circle cx="132" cy="108" r="18" fill="#1B1726" />
        <circle cx="132" cy="108" r="7" fill="#9B5FD9" />
        {/* brand cube */}
        <g transform="translate(40 40)">
          <path d="M18 2 L34 11 V29 L18 38 L2 29 V11 Z" fill="none" stroke="#7B2FBE" strokeWidth="3" strokeLinejoin="round" />
        </g>
      </g>

      {/* stacked boxes */}
      <g transform="translate(28 258)">
        <rect x="0" y="34" width="44" height="30" rx="3" fill="#C9A8F0" />
        <rect x="0" y="34" width="44" height="30" rx="3" fill="none" stroke="#7B2FBE" strokeWidth="1.5" />
        <path d="M22 34 v30 M0 49 h44" stroke="#7B2FBE" strokeWidth="1.5" opacity="0.5" />
        <rect x="8" y="2" width="32" height="30" rx="3" fill="#E0CFF6" />
        <path d="M24 2 v30 M8 17 h32" stroke="#7B2FBE" strokeWidth="1.5" opacity="0.4" />
      </g>
    </svg>
  );
}
