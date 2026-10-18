import { useState } from "react";
import { toast } from "sonner";
import { Calculator, FileSpreadsheet, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { apiError, cleanStops, downloadBlob, fmtKm, fmtMin, routeKey } from "@/lib/maps";

export const LegsSummary = ({ route, update, result, setResult, onCalculated, tripName, validate }) => {
  const [busy, setBusy] = useState(null);

  const body = () => ({
    origin: route.origin,
    destination: route.destination,
    waypoints: cleanStops(route.waypoints),
    mode: route.mode,
  });
  const key = routeKey(route);
  const fresh = result && result.key === key;
  const legDate = (i) => route.legDates[i] || route.date;
  const setLegDate = (i, v) => {
    const arr = [...route.legDates];
    arr[i] = v;
    update({ legDates: Array.from(arr, (x) => x || "") });
  };

  const calculate = async () => {
    if (!validate()) return;
    setBusy("calc");
    try {
      const { data } = await api.post("/route/legs", body());
      setResult({ ...data, key });
      await onCalculated();
    } catch (e) {
      toast.error(await apiError(e, "Calcolo delle tratte non riuscito"));
    } finally {
      setBusy(null);
    }
  };

  const exportExcel = async () => {
    if (!validate()) return;
    setBusy("xls");
    try {
      const legs = fresh ? result.legs : [];
      const { data } = await api.post(
        "/route/excel",
        { ...body(), date: route.date, leg_dates: legs.map((_, i) => legDate(i)), name: tripName || null },
        { responseType: "blob" }
      );
      downloadBlob(data, `tratte_${route.date}.xlsx`);
      toast.success("File Excel creato");
    } catch (e) {
      toast.error(await apiError(e, "Creazione Excel non riuscita"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 sm:p-6" data-testid="legs-summary">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div className="text-xs font-semibold tracking-wider uppercase text-slate-500">Tratte e distanze</div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          Data viaggio
          <input type="date" value={route.date} onChange={(e) => e.target.value && update({ date: e.target.value })} data-testid="input-trip-date" className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50/60 text-sm focus:outline-none focus:border-slate-900" />
        </label>
      </div>

      {result && (
        <div className={fresh ? "" : "opacity-50"} data-testid="legs-result">
          <ul className="divide-y divide-slate-100 mb-3">
            {result.legs.map((l, i) => (
              <li key={l.index} className="py-2.5 flex items-start gap-3 text-sm" data-testid={`leg-row-${l.index}`}>
                <span className="font-mono-ui text-[11px] w-6 h-6 mt-0.5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">{l.index}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-slate-700">{l.from} → {l.to}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <input
                      type="date"
                      value={legDate(i)}
                      onChange={(e) => setLegDate(i, e.target.value)}
                      data-testid={`input-leg-date-${l.index}`}
                      aria-label={`Data tratta ${l.index}`}
                      className="h-8 px-2 rounded-md border border-slate-200 bg-slate-50/60 text-xs focus:outline-none focus:border-slate-900"
                    />
                    <span className="font-mono-ui text-slate-900">{fmtKm(l.distance_km)} km</span>
                    <span className="font-mono-ui text-slate-400">{fmtMin(l.duration_min)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex items-baseline justify-between rounded-xl bg-slate-900 text-white px-4 py-3">
            <span className="text-sm font-medium">Totale</span>
            <span className="font-heading text-2xl font-semibold" data-testid="legs-total-km">{fmtKm(result.total_km)} km</span>
            <span className="font-mono-ui text-xs text-slate-300" data-testid="legs-total-time">{fmtMin(result.total_min)}</span>
          </div>
          {!fresh && <p className="mt-2 text-xs text-amber-700" data-testid="legs-stale-warning">Percorso modificato: ricalcola le tratte.</p>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button type="button" onClick={calculate} disabled={!!busy} data-testid="btn-calculate-legs" className="h-12 flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-60 transition-colors">
          {busy === "calc" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />} Calcola tratte
        </button>
        <button type="button" onClick={exportExcel} disabled={!!busy} data-testid="btn-export-excel" className="h-12 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-60 transition-colors">
          {busy === "xls" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Esporta Excel
        </button>
      </div>
    </div>
  );
};
