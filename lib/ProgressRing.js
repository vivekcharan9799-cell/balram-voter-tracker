export default function ProgressRing({ percent, size = 180, label, sub }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = c - (clamped / 100) * c;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="800"
        fill="var(--text)"
        fontFamily="'Barlow Condensed', sans-serif"
      >
        {Math.round(clamped)}%
      </text>
      {label && (
        <text
          x="50%"
          y="64%"
          textAnchor="middle"
          fontSize={size * 0.08}
          fill="var(--muted)"
          fontFamily="'Inter', sans-serif"
        >
          {label}
        </text>
      )}
      {sub && (
        <text
          x="50%"
          y="76%"
          textAnchor="middle"
          fontSize={size * 0.07}
          fill="var(--accent)"
          fontFamily="'Inter', sans-serif"
          fontWeight="700"
        >
          {sub}
        </text>
      )}
    </svg>
  );
}
