import { Bike, Car, Footprints, TrainFront } from "lucide-react";
import { MODES } from "@/lib/maps";

const ICONS = { driving: Car, walking: Footprints, bicycling: Bike, transit: TrainFront };

export const ModeSelector = ({ mode, onChange, hasStops }) => (
  <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 sm:p-6">
    <div className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-3">Mezzo di trasporto</div>
    <div className="grid grid-cols-4 gap-2 p-1 bg-slate-100 rounded-xl" role="radiogroup">
      {MODES.map((m) => {
        const Icon = ICONS[m.key];
        const active = mode === m.key;
        return (
          <button
            key={m.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(m.key)}
            data-testid={m.testid}
            className={`h-14 flex flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium transition-colors ${
              active ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            <Icon className="w-5 h-5" />
            {m.label}
          </button>
        );
      })}
    </div>
    {mode === "transit" && hasStops && (
      <p className="mt-3 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2" data-testid="transit-warning">
        Con i mezzi pubblici Google Maps non supporta le tappe intermedie: verranno ignorate.
      </p>
    )}
  </div>
);
