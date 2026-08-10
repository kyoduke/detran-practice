export default function AppBar({ children }) {
  return (
    <div className="flex w-full items-center justify-between border-b border-border bg-surface px-8 py-5">
      {children}
    </div>
  );
}
