import { ArrowLeft } from "lucide-react";
import Button from "./Button";

const statusConfig = {
  none: { dot: "bg-text-muted", text: "text-text-muted", label: "Nenhuma resposta selecionada" },
  correct: { dot: "bg-success", text: "text-success", label: "Resposta correta" },
  incorrect: { dot: "bg-error", text: "text-error", label: "Resposta incorreta" },
};

export default function ActionDock({
  status = "none",
  confirmed,
  disabled,
  nextLabel = "Próxima",
  onConfirm,
  onNext,
  onBack,
  canGoBack,
}) {
  const s = statusConfig[status];

  return (
    <div className="flex w-full items-center justify-between border-t border-border pt-4">
      <div className="flex items-center gap-3">
        <button
          className="flex cursor-pointer items-center gap-2 bg-transparent font-body text-[13px] font-semibold text-text-secondary transition enabled:hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
          disabled={!canGoBack}
          onClick={onBack}
        >
          <span className="text-text-muted">
            <ArrowLeft size={14} />
          </span>
          Anterior
        </button>
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          <span className={`font-body text-xs ${s.text}`}>{s.label}</span>
        </span>
      </div>
      {!confirmed ? (
        <Button
          variant={disabled ? "outline" : "primary"}
          icon="check"
          disabled={disabled}
          onClick={onConfirm}
          className={disabled ? "pointer-events-none opacity-50" : ""}
        >
          Confirmar
        </Button>
      ) : (
        <Button variant="primary" onClick={onNext}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
