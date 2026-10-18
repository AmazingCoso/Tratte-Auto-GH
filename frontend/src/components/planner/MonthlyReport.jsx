import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CalendarRange, FileSpreadsheet, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { apiError, downloadBlob, fmtKm, fmtMin, today } from "@/lib/maps";

export const MonthlyReport = ({ version }) => {
  const [month, setMonth] = useState(today().slice(0, 7));
  const [stats, setStats] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!month) return;
    api.get("/reports/monthly", { params: { month } }).then(({ data }) => setStats(data)).catch(() => setStats(null));
  }, [month, version]);

  const exportExcel = async () => {
    setBusy(true);
    try {
      const { data } = await api.get("/reports/monthly/excel", { params: { month }, responseType: "blob" });
      downloadBlob(data, `report_km_${month}.xlsx`);
      toast.success("Report mensile creato");
    } catch (e) {
      toast.error(await apiError(e, "Creazione report non riuscita"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 sm:p-5" data-testid="monthly-report">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <CalendarRange className="w-4 h-4 text-blue-600" /> Report km mensile
        </h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} data-testid="input-report-month" className="h-10 px-3 rounded-lg border border-slate-200 bg-slate-50/60 text-sm focus:outline-none focus:border-slate-900" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          ["Km totali", stats ? fmtKm(stats.total_km) : "–", "report-total-km"],
          ["Tempo", stats ? fmtMin(stats.total_min) : "–", "report-total-time"],
          ["Tratte", stats ? stats.legs : "–", "report-legs-count"],
        ].map(([label, val, tid]) => (
          <div key={tid} className="rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
            <div className="font-heading text-lg font-semibold text-slate-900 truncate" data-testid={tid}>{val}</div>
          </div>
        ))}
      </div>
      <button type="button" onClick={exportExcel} disabled={busy || !month} data-testid="btn-export-monthly-report" className="w-full h-12 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold hover:bg-emerald-100 disabled:opacity-60 transition-colors">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />} Scarica report Excel del mese
      </button>
      <p className="mt-2 text-xs text-slate-400">Somma le tratte dei viaggi salvati in base alla data di ogni tratta.</p>
    </div>
  );
};
