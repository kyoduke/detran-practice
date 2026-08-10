import { ArrowRight, Lock } from "lucide-react";

export default function ModeRow({
  icon: Icon,
  title,
  subtitle,
  active,
  disabled,
  onClick,
}) {
  return (
    <button
      className={`flex w-full cursor-pointer items-center gap-3 border-b border-border py-3.5 text-left transition hover:bg-surface-muted disabled:cursor-default disabled:opacity-60 ${disabled ? "border-b-0" : ""}`}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
          active ? "bg-primary-soft" : "bg-surface-muted"
        }`}
      >
        <Icon
          size={20}
          className={active ? "text-primary" : disabled ? "text-text-muted" : "text-text-secondary"}
        />
      </div>
      <div className="flex flex-1 flex-col gap-0.5">
        <span
          className={`font-display text-[15px] font-bold ${
            disabled ? "text-text-muted" : "text-text-primary"
          }`}
        >
          {title}
        </span>
        <span
          className={`font-body text-xs ${
            disabled ? "text-text-muted" : "text-text-secondary"
          }`}
        >
          {subtitle}
        </span>
      </div>
      {disabled ? (
        <Lock size={14} className="text-text-muted" />
      ) : (
        <ArrowRight
          size={18}
          className={active ? "text-primary" : "text-text-muted"}
        />
      )}
    </button>
  );
}
