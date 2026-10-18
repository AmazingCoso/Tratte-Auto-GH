import { Flag, Plus } from "lucide-react";
import { newWaypoint } from "@/lib/maps";
import { StopRow } from "@/components/planner/StopRow";
import { GpsButton } from "@/components/planner/GpsButton";

export const RouteForm = ({ route, update }) => {
  const { waypoints } = route;

  const setWp = (i, value) => update({ waypoints: waypoints.map((w, j) => (j === i ? { ...w, value } : w)) });
  const removeWp = (i) => update({ waypoints: waypoints.filter((_, j) => j !== i) });
  const moveWp = (i, dir) => {
    const next = [...waypoints];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    update({ waypoints: next });
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 sm:p-6" data-testid="route-form">
      <div className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-4">Percorso</div>
      <div className="stop-rail space-y-3">
        <StopRow
          marker={<span className="w-3 h-3 rounded-full border-[3px] border-slate-900 bg-white" />}
          label="Partenza"
          value={route.origin}
          onChange={(origin) => update({ origin })}
          placeholder="Indirizzo o coordinate GPS"
          testid="input-origin"
          trailing={<GpsButton testid="btn-gps-origin" onLocated={(origin) => update({ origin })} />}
        />
        {waypoints.map((w, i) => (
          <StopRow
            key={w.id}
            marker={<span className="font-mono-ui text-[11px] font-medium text-slate-600">{i + 1}</span>}
            label={`Tappa ${i + 1}`}
            value={w.value}
            onChange={(v) => setWp(i, v)}
            placeholder="Indirizzo tappa"
            testid={`input-waypoint-${i}`}
            trailing={<GpsButton compact testid={`btn-gps-waypoint-${i}`} onLocated={(v) => setWp(i, v)} />}
            index={i}
            total={waypoints.length}
            onMove={(dir) => moveWp(i, dir)}
            onRemove={() => removeWp(i)}
          />
        ))}
        <div className="pl-12">
          <button
            type="button"
            onClick={() => update({ waypoints: [...waypoints, newWaypoint()] })}
            data-testid="btn-add-waypoint"
            className="w-full h-11 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-sm font-medium text-slate-600 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Aggiungi tappa
          </button>
        </div>
        <StopRow
          marker={<Flag className="w-3.5 h-3.5 text-white" />}
          markerClass="bg-slate-900 border-slate-900"
          label="Destinazione finale"
          value={route.destination}
          onChange={(destination) => update({ destination })}
          placeholder="Indirizzo o coordinate GPS"
          testid="input-destination"
          trailing={<GpsButton testid="btn-gps-destination" onLocated={(destination) => update({ destination })} />}
        />
      </div>
    </div>
  );
};
