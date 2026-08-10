const colorMap = {
  primary: { bg: "bg-primary-soft", dot: "bg-primary", text: "text-primary" },
  success: { bg: "bg-success-soft", dot: "bg-success", text: "text-success" },
  error: { bg: "bg-error-soft", dot: "bg-error", text: "text-error" },
  warning: { bg: "bg-warning-soft", dot: "bg-warning", text: "text-warning" },
};

export default function Badge({ color = "primary", label, hideDot = false }) {
  const c = colorMap[color] || colorMap.primary;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-display text-xs font-semibold ${c.bg} ${c.text}`}
    >
      {!hideDot && <span className={`h-2 w-2 rounded-full ${c.dot}`} />}
      {label}
    </span>
  );
}
