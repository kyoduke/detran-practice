const stateStyles = {
  default: "border-border bg-surface",
  selected: "border-primary bg-primary-soft",
  correct: "border-success bg-success-soft",
  incorrect: "border-error bg-error-soft",
};

const badgeStyles = {
  default: "bg-primary-soft text-primary",
  selected: "bg-primary text-white",
  correct: "bg-success text-white",
  incorrect: "bg-error text-white",
};

function getState(answer, answered, selectedAnswerId) {
  if (answered && answer.is_correct) return "correct";
  if (answered && answer.id === selectedAnswerId) return "incorrect";
  if (answer.id === selectedAnswerId) return "selected";
  return "default";
}

export default function AnswerOption({
  answer,
  letter,
  answered,
  selectedAnswerId,
  onSelect,
}) {
  const state = getState(answer, answered, selectedAnswerId);

  return (
    <button
      className={`flex w-full cursor-pointer items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3.5 text-left transition disabled:cursor-default ${stateStyles[state]}`}
      disabled={answered}
      type="button"
      onClick={() => onSelect(answer.id)}
    >
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-display text-sm font-bold ${badgeStyles[state]}`}
      >
        {letter}
      </div>
      <span className="font-body text-[15px] leading-relaxed text-text-primary">
        {answer.text}
      </span>
    </button>
  );
}
