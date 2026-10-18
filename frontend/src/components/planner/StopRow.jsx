import { ChevronDown, ChevronUp, X } from "lucide-react";
import { AddressInput } from "@/components/planner/AddressInput";
import { GpsButton } from "@/components/planner/GpsButton";
import { FavoritePicker } from "@/components/planner/FavoritePicker";

const iconBtn =
  "w-8 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors";

export const StopRow = ({ marker, markerClass = "bg-white border-slate-200", label, value, onChange, placeholder, testid, index, total, onMove, onRemove }) => (
  <div className="relative z-10 focus-within:z-30 flex items-center gap-2">
    <div className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center ${markerClass}`}>{marker}</div>
    <div className="flex-1 min-w-0">
      <div className="flex items-end justify-between gap-2 mb-1 pl-1">
        <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</label>
        <div className="flex items-center -my-1">
          <FavoritePicker testid={testid.replace("input-", "btn-fav-")} onPick={onChange} />
        {onRemove && (
          <div className="flex items-center">
            <button type="button" className={iconBtn} disabled={index === 0} onClick={() => onMove(-1)} data-testid={`btn-move-up-waypoint-${index}`} aria-label="Sposta su">
              <ChevronUp className="w-4 h-4" />
            </button>
            <button type="button" className={iconBtn} disabled={index === total - 1} onClick={() => onMove(1)} data-testid={`btn-move-down-waypoint-${index}`} aria-label="Sposta giù">
              <ChevronDown className="w-4 h-4" />
            </button>
            <button type="button" className={`${iconBtn} hover:!text-red-600 hover:!bg-red-50`} onClick={onRemove} data-testid={`btn-remove-waypoint-${index}`} aria-label="Rimuovi tappa">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <AddressInput value={value} onChange={onChange} placeholder={placeholder} testid={testid} />
        <GpsButton testid={testid.replace("input-", "btn-gps-")} onLocated={onChange} />
      </div>
    </div>
  </div>
);
