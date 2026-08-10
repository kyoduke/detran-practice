import ProgressBar from "./ProgressBar";

export default function ConsoleBar({ modeLabel, counter, progress, progressWidth }) {
  return (
    <div className="flex w-full items-center justify-between bg-primary-strong px-8 py-[18px]">
      <div className="flex flex-col gap-1">
        <span className="font-display text-[11px] font-bold uppercase tracking-[1.5px] text-white/60">
          {modeLabel}
        </span>
        <span className="font-display text-[19px] font-bold text-white">
          {counter}
        </span>
      </div>
      <ProgressBar
        width={170}
        fill={progressWidth}
        trackColor="rgba(255,255,255,0.18)"
        fillColor="#FFFFFF"
      />
    </div>
  );
}
