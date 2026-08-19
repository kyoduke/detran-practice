import Button from "./Button";

function Key({ children }) {
  return (
    <kbd className="flex items-center justify-center rounded-[var(--radius-sm)] border border-border bg-surface-muted px-2.5 py-1 font-display text-sm font-bold text-text-primary">
      {children}
    </kbd>
  );
}

function ShortcutRow({ keys, description }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1.5">
        {keys.map((key) => (
          <Key key={key}>{key}</Key>
        ))}
      </div>
      <span className="font-body text-sm text-text-primary">{description}</span>
    </div>
  );
}

export default function ShortcutsPopup({
  onDismissForSession,
  onDismissForever,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Atalhos de teclado"
    >
      <div className="w-full max-w-[520px] rounded-[var(--radius-lg)] border border-border bg-surface p-7">
        <h2 className="font-display text-[22px] font-bold text-text-primary">
          Atalhos de teclado
        </h2>
        <p className="mt-1 font-body text-sm text-text-secondary">
          Responda sem tirar a mão do teclado.
        </p>

        <div className="mt-5 flex flex-col gap-3.5">
          <ShortcutRow
            keys={["1", "2", "3", "4"]}
            description="Escolher a alternativa"
          />
          <ShortcutRow keys={["Enter"]} description="Confirmar e avançar" />
          <ShortcutRow keys={["←", "→"]} description="Voltar e avançar" />
          <ShortcutRow keys={["Esc"]} description="Sair da sessão" />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <Button variant="ghost" onClick={onDismissForever}>
            Não mostrar novamente
          </Button>
          <Button onClick={onDismissForSession}>Entendi, começar</Button>
        </div>
      </div>
    </div>
  );
}
