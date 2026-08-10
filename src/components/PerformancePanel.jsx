import { ListChecks, RotateCcw } from "lucide-react";
import ScoreRing from "./ScoreRing";
import Badge from "./Badge";

export default function PerformancePanel({
  percentage,
  hits,
  misses,
  totalPracticed,
  onReset,
}) {
  return (
    <div className="flex w-60 flex-col items-center gap-3.5 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <span className="w-full font-display text-xs font-bold uppercase tracking-[1.5px] text-text-muted">
        Seu desempenho
      </span>

      <ScoreRing
        score={`${percentage}%`}
        percentage={percentage}
        size={140}
        caption="aproveitamento geral"
      />

      <div className="flex w-full justify-center gap-2">
        <Badge label={`${hits} acertos`} />
        <Badge color="error" label={`${misses} erros`} />
      </div>

      <div className="h-px w-full bg-border" />

      <div className="flex w-full items-center gap-2">
        <ListChecks size={14} className="text-text-muted" />
        <span className="font-body text-xs text-text-secondary">
          {totalPracticed} questões praticadas
        </span>
      </div>

      <button
        className="flex w-full cursor-pointer items-center justify-end gap-1.5 bg-transparent font-body text-xs font-semibold text-text-secondary transition hover:text-text-primary"
        type="button"
        onClick={onReset}
      >
        <RotateCcw size={14} className="text-text-muted" />
        Resetar progresso
      </button>
    </div>
  );
}
