import { useState } from "react";
import { toast } from "sonner";
import { Crosshair, Flag, Loader2, Plus } from "lucide-react";
import { newWaypoint } from "@/lib/maps";
import { StopRow } from "@/components/planner/StopRow";

export const RouteForm = ({ route, update }) => {
  const [locating, setLocating] = useState(false);
  const { waypoints } = route;

  const getGPS = () => {
    if (!navigator.geolocation) return toast.error("Geolocalizzazione non supportata.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update({ origin: `${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}` });
        setLocating(false);
        toast.success("Posizione GPS rilevata");
      },
      (err) => {
        setLocating(false);
        toast.error(`Errore GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const setWp = (i, value) => update({ waypoints: waypoints.map((w, j) => (j === i ? { ...w, value } : w)) });
  const removeWp = (i) => update({ waypoints: waypoints.filter((_, j) => j !== i) });
  const moveWp = (i, dir) => {
    const next = [...waypoints];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    update({ waypoints: next });
  };

  const gpsButton = (
    <button
      type="button"
      onClick={getGPS}
      disabled={locating}
      data-testid="btn-gps-origin"
      className="shrink-0 h-12 px-3.5 flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 disabled:opacity-60 transition-colors"
    >
      {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
      <span>{locating ? "Rilevo…" : "GPS"}</span>
    </button>
  );

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 sm:p-6" data-testid="route-form">
      <div className="text-xs font-semibold tracking-wider uppercase text-slate-500 mb-4">Percorso</div>
      <div className="stop-rail space-y-3">
        <StopRow
          marker={<span className="w-3 h-3 rounded-full border-[3px] border-slate-900 bg-white" />}
          label="Partenza"
          value={route.origin}
          onChange={(origin) => update({ origin })}
          placeholder={locating ? "Rilevamento in corso…" : "Indirizzo o coordinate GPS"}
          testid="input-origin"
          trailing={gpsButton}
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
          placeholder="Es. indirizzo di arrivo"
          testid="input-destination"
        />
      </div>
    </div>
  );
};
