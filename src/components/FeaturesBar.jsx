import { Timer, BadgeCheck, UserCheck } from "lucide-react";

const features = [
  { icon: Timer, label: "Simulado cronometrado" },
  { icon: BadgeCheck, label: "Gabarito na hora" },
  { icon: UserCheck, label: "Sem cadastro" },
];

export default function FeaturesBar() {
  return (
    <div className="flex w-full items-center justify-center gap-7 bg-surface-muted px-10 py-3.5">
      {features.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2">
          <Icon size={14} className="text-text-muted" />
          <span className="font-body text-xs text-text-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
