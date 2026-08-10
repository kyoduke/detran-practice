export default function ScoreRing({
  score,
  total,
  percentage,
  size = 160,
  caption,
}) {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const maxSweep = circumference * 0.8;
  const sweep = (percentage / 100) * maxSweep;
  const center = size / 2;

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute inset-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - sweep}
          transform={`rotate(-90 ${center} ${center})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center">
        <span className="font-display text-[36px] font-bold text-text-primary">
          {score}
        </span>
        <span className="font-body text-xs text-text-muted">
          {caption || `de ${total}`}
        </span>
      </div>
    </div>
  );
}
