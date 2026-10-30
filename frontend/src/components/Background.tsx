/** Fixed atmospheric backdrop: night sky, moon, palace skyline, drifting embers. */
export function Background() {
  return (
    <div className="bg-scene" aria-hidden>
      <div className="bg-sky" />
      <div className="bg-stars" />
      <div className="bg-moon" />
      <svg className="bg-palace" viewBox="0 0 1440 360" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="palace-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1D1745" />
            <stop offset="100%" stopColor="#0B0F24" />
          </linearGradient>
          <linearGradient id="palace-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#120D2E" />
            <stop offset="100%" stopColor="#060914" />
          </linearGradient>
        </defs>
        {/* far fort wall */}
        <path
          fill="url(#palace-far)"
          d="M0 360V230h40v-20h20v20h40v-40h16v-14h8v14h16v40h60v-70q30-50 60 0v70h50v-30h14v-24l10-14 10 14v24h14v30h70V170q50-90 100 0v20h20v-60l14-22 14 22v60h20v-20q50-90 100 0v30h70v-30h14v-24l10-14 10 14v24h14v30h50v-70q30-50 60 0v70h60v-40h16v-14h8v14h16v40h40v-20h20v20h80v130Z"
        />
        {/* windows glowing */}
        <g fill="#FFC83D" opacity="0.55">
          {[280, 520, 560, 700, 735, 880, 920, 1160].map((x, i) => (
            <rect key={x} className="bg-window" style={{ animationDelay: `${i * 0.7}s` }} x={x} y={i % 2 ? 230 : 250} width="8" height="14" rx="4" />
          ))}
        </g>
        {/* near palace with domes */}
        <path
          fill="url(#palace-near)"
          d="M0 360V300h90v-36q30-40 60 0v36h60v-20h10v-30l20-26 20 26v30h10v20h120v-50q60-80 120 0v50h80v-70q70-110 140 0v70h80v-50q60-80 120 0v50h120v-20h10v-30l20-26 20 26v30h10v20h60v-36q30-40 60 0v36h90v60Z"
        />
        {/* lanterns */}
        {[150, 470, 970, 1290].map((x, i) => (
          <g key={x} className="bg-lantern" style={{ animationDelay: `${i * 0.9}s` }}>
            <circle cx={x} cy={292} r="18" fill="#FFB800" opacity="0.18" />
            <rect x={x - 4} y={285} width="8" height="12" rx="2" fill="#FFC83D" />
          </g>
        ))}
      </svg>
      <div className="bg-mist" />
      <div className="bg-embers">
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={i}
            style={
              {
                "--x": `${(i * 47) % 100}%`,
                "--d": `${9 + ((i * 7) % 9)}s`,
                "--delay": `${-((i * 13) % 17)}s`,
                "--s": `${2 + (i % 3)}px`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <div className="bg-vignette" />
    </div>
  );
}
