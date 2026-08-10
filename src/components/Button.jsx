import {
  Check,
  ArrowLeft,
  BookOpen,
  RotateCcw,
  Trash2,
} from "lucide-react";

const variants = {
  primary:
    "bg-primary text-white hover:bg-primary-strong disabled:bg-border disabled:text-text-muted",
  secondary:
    "border border-primary bg-surface text-primary hover:bg-primary-soft",
  outline:
    "border border-border bg-surface text-text-primary hover:bg-surface-muted",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-muted",
  destructive:
    "bg-error text-white hover:bg-error/90 disabled:bg-border disabled:text-text-muted",
};

const icons = {
  check: Check,
  "arrow-left": ArrowLeft,
  "book-open": BookOpen,
  "rotate-ccw": RotateCcw,
  "trash-2": Trash2,
};

export default function Button({
  variant = "primary",
  icon,
  children,
  disabled,
  onClick,
  className = "",
}) {
  const Icon = icon ? icons[icon] : null;

  return (
    <button
      className={`inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 font-display text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
