import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Compass, RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { buildMapsUrl, newWaypoint, routeKey, today } from "@/lib/maps";
import { RouteForm } from "@/components/planner/RouteForm";
import { ActionBar } from "@/components/planner/ActionBar";
import { MapPreview } from "@/components/planner/MapPreview";
import { SaveTripDialog } from "@/components/planner/SaveTripDialog";
import { SavedTrips } from "@/components/planner/SavedTrips";
import { LegsSummary } from "@/components/planner/LegsSummary";
import { MonthlyReport } from "@/components/planner/MonthlyReport";

const emptyRoute = () => ({ origin: "", destination: "", waypoints: [], mode: "driving", date: today(), legDates: [] });
const legsFromTrip = (trip, route) =>
  trip.legs ? { legs: trip.legs, total_km: trip.total_km, total_min: trip.total_min, mode: trip.mode, key: routeKey(route) } : null;

export default function Planner() {
  const [route, setRoute] = useState(emptyRoute);
  const [legsResult, setLegsResult] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingTrips, setLoadingTrips] = useState(true);

  const fetchTrips = useCallback(async (q) => {
    try {
      const { data } = await api.get("/trips", { params: q ? { q } : {} });
      setTrips(data);
    } catch {
      toast.error("Impossibile caricare i viaggi salvati");
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchTrips(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search, fetchTrips]);

  const update = (patch) => setRoute((r) => ({ ...r, ...patch }));
  const isValid = route.origin.trim() && route.destination.trim();

  const requireValid = () => {
    if (!isValid) toast.error("Inserisci almeno Partenza e Destinazione!");
    return isValid;
  };

  const openMaps = () => requireValid() && window.open(buildMapsUrl(route), "_blank");

  const copyLink = async () => {
    if (!requireValid()) return;
    try {
      await navigator.clipboard.writeText(buildMapsUrl(route));
      toast.success("Link del percorso copiato");
    } catch {
      toast.error("Copia non riuscita");
    }
  };

  const share = async () => {
    if (!requireValid()) return;
    const url = buildMapsUrl(route);
    const title = currentTrip?.name || "Il mio percorso";
    if (navigator.share) {
      try {
        await navigator.share({ title, text: title, url });
      } catch {
        /* utente ha annullato */
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${title}: ${url}`)}`, "_blank");
    }
  };

  const openSave = () => requireValid() && setSaveOpen(true);

  const payload = (meta) => ({
    ...meta,
    origin: route.origin,
    destination: route.destination,
    waypoints: route.waypoints.map((w) => w.value),
    mode: route.mode,
    date: route.date,
    leg_dates: route.legDates,
  });

  const saveTrip = async (meta, asNew, auto = false) => {
    try {
      const { data } = asNew || !currentTrip
        ? await api.post("/trips", payload(meta))
        : await api.put(`/trips/${currentTrip.id}`, payload(meta));
      setCurrentTrip(data);
      if (data.legs) setLegsResult(legsFromTrip(data, route));
      setSaveOpen(false);
      if (auto) toast.success(`Tratte calcolate e salvate in "${data.name}"`);
      else toast.success(asNew || !currentTrip ? "Viaggio salvato" : "Viaggio aggiornato");
      if (!data.legs) toast.warning("Distanze non calcolate: verifica gli indirizzi");
      fetchTrips(search.trim());
    } catch {
      toast.error("Salvataggio non riuscito");
    }
  };

  const short = (s) => s.split(",")[0].trim();
  const autoSave = () =>
    saveTrip(
      currentTrip
        ? { name: currentTrip.name, notes: currentTrip.notes }
        : { name: `${short(route.origin)} → ${short(route.destination)}`.slice(0, 120), notes: "" },
      false,
      true
    );

  const loadTrip = (trip) => {
    const next = {
      origin: trip.origin,
      destination: trip.destination,
      waypoints: trip.waypoints.map((w) => newWaypoint(w)),
      mode: "driving",
      date: trip.date,
      legDates: trip.leg_dates || [],
    };
    setRoute(next);
    setLegsResult(legsFromTrip(trip, next));
    setCurrentTrip(trip);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(`"${trip.name}" caricato nel pianificatore`);
  };

  const duplicateTrip = async (trip) => {
    try {
      await api.post(`/trips/${trip.id}/duplicate`);
      toast.success("Viaggio duplicato");
      fetchTrips(search.trim());
    } catch {
      toast.error("Duplicazione non riuscita");
    }
  };

  const deleteTrip = async (trip) => {
    try {
      await api.delete(`/trips/${trip.id}`);
      if (currentTrip?.id === trip.id) setCurrentTrip(null);
      toast.success("Viaggio eliminato");
      fetchTrips(search.trim());
    } catch {
      toast.error("Eliminazione non riuscita");
    }
  };

  const reset = () => {
    setRoute(emptyRoute());
    setLegsResult(null);
    setCurrentTrip(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-36 lg:pb-16">
        <header className="flex items-start justify-between gap-4 mb-8 fade-up">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-slate-500 mb-3">
              <Compass className="w-4 h-4 text-blue-600" /> Ruta
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight" data-testid="app-title">
              Pianificatore Viaggio
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500 max-w-md">
              {currentTrip ? (
                <span data-testid="current-trip-label">Stai modificando: <b className="text-slate-800">{currentTrip.name}</b></span>
              ) : (
                "Componi il percorso, salva i tuoi viaggi e aprili su Google Maps."
              )}
            </p>
          </div>
          <button
            onClick={reset}
            data-testid="btn-reset-planner"
            className="shrink-0 flex items-center gap-2 h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Nuovo</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <section className="relative z-20 lg:z-auto lg:col-span-7 space-y-5 fade-up" style={{ animationDelay: "80ms" }}>
            <RouteForm route={route} update={update} />
            <LegsSummary route={route} update={update} result={legsResult} setResult={setLegsResult} onCalculated={autoSave} tripName={currentTrip?.name} validate={requireValid} />
            <ActionBar onOpen={openMaps} onCopy={copyLink} onShare={share} onSave={openSave} isEditing={!!currentTrip} />
          </section>
          <aside className="lg:col-span-5 space-y-5 fade-up" style={{ animationDelay: "160ms" }}>
            <MapPreview route={route} />
            <SavedTrips
              trips={trips}
              loading={loadingTrips}
              search={search}
              onSearch={setSearch}
              currentId={currentTrip?.id}
              onLoad={loadTrip}
              onDuplicate={duplicateTrip}
              onDelete={deleteTrip}
            />
            <MonthlyReport version={trips} />
          </aside>
        </div>
      </div>
      <SaveTripDialog open={saveOpen} onOpenChange={setSaveOpen} currentTrip={currentTrip} onSave={saveTrip} />
    </div>
  );
}
