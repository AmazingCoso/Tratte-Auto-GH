import { ChevronDown, ChevronUp, X } from "lucide-react";

const iconBtn =
  "w-8 sm:w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors";

export const StopRow = ({ marker, markerClass = "bg-white border-slate-200", label, value, onChange, placeholder, testid, trailing, index, total, onMove, onRemove }) => (
  <div className="relative z-10 flex items-center gap-2">
    <div className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center ${markerClass}`}>{marker}</div>
    <div className="flex-1 min-w-0">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 pl-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          data-testid={testid}
          className="flex-1 min-w-0 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/60 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-colors"
        />
        {trailing}
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
  </div>
);
