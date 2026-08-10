export default function ProgressBar({
  width = 200,
  fill = 0,
  trackColor = "var(--color-border)",
  fillColor = "var(--color-primary)",
  height = 8,
}) {
  return (
    <div
      className="relative overflow-hidden rounded-full"
      style={{ width, height, backgroundColor: trackColor }}
    >
      <div
        className="absolute top-0 left-0 h-full rounded-full transition-all duration-300"
        style={{ width: fill, backgroundColor: fillColor }}
      />
    </div>
  );
}
