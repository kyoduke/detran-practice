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
}) {
  const s = statusConfig[status];

  return (
    <div className="flex w-full items-center justify-between border-t border-border pt-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className={`font-body text-xs ${s.text}`}>{s.label}</span>
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
