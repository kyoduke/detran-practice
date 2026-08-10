export default function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary font-display text-sm font-extrabold text-white">
        RJ
      </div>
      <div className="flex flex-col gap-[3px]">
        <span className="font-display text-[17px] font-bold tracking-wide text-text-primary">
          DETRAN
        </span>
        <div className="h-1 w-[34px] rounded-sm bg-accent" />
      </div>
    </div>
  );
}
