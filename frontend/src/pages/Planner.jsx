import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { buildMapsUrl, newWaypoint, routeKey, today } from "@/lib/maps";
import { useSavedTrips } from "@/hooks/useSavedTrips";
import { useDateAutoSave } from "@/hooks/useDateAutoSave";
import { PlannerHeader } from "@/components/planner/PlannerHeader";
import { RouteForm } from "@/components/planner/RouteForm";
import { ActionBar } from "@/components/planner/ActionBar";
import { MapPreview } from "@/components/planner/MapPreview";
import { SaveTripDialog } from "@/components/planner/SaveTripDialog";
import { SavedTrips } from "@/components/planner/SavedTrips";
import { LegsSummary } from "@/components/planner/LegsSummary";
import { MonthlyReport } from "@/components/planner/MonthlyReport";
import { FavoritesPanel } from "@/components/planner/FavoritesPanel";

const emptyRoute = () => ({ origin: "", destination: "", waypoints: [], mode: "driving", date: today(), legDates: [] });
const legsFromTrip = (trip, route) =>
  trip.legs ? { legs: trip.legs, total_km: trip.total_km, total_min: trip.total_min, mode: trip.mode, key: routeKey(route) } : null;

export default function Planner() {
  const { current, select } = useProfile();
  const [route, setRoute] = useState(emptyRoute);
  const [legsResult, setLegsResult] = useState(null);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const { trips, search, setSearch, loading: loadingTrips, refresh, duplicateTrip, deleteTrip: removeTrip } = useSavedTrips();

  const onDatesSaved = useCallback(
    (data) => {
      setCurrentTrip(data);
      refresh();
    },
    [refresh]
  );
  useDateAutoSave({ currentTrip, route, onSaved: onDatesSaved });

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
      } catch (err) {
        if (err?.name !== "AbortError") toast.error("Condivisione non riuscita");
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
      refresh();
    } catch {
      toast.error("Salvataggio non riuscito");
    }
  };

  const short = (s) => s.split(",")[0].trim();
  const autoName = (o, d) => `${short(o)} → ${short(d)}`.slice(0, 120);
  const autoSave = () => {
    const keepName = currentTrip && currentTrip.name !== autoName(currentTrip.origin, currentTrip.destination);
    return saveTrip(
      { name: keepName ? currentTrip.name : autoName(route.origin, route.destination), notes: currentTrip?.notes || "" },
      false,
      true
    );
  };

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

  const deleteTrip = async (trip) => {
    if ((await removeTrip(trip)) && currentTrip?.id === trip.id) setCurrentTrip(null);
  };

  const reset = () => {
    setRoute(emptyRoute());
    setLegsResult(null);
    setCurrentTrip(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10 pb-36 lg:pb-16">
        <PlannerHeader profile={current} currentTrip={currentTrip} onSwitchProfile={() => select(null)} onReset={reset} />

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
            <FavoritesPanel />
            <MonthlyReport version={trips} />
          </aside>
        </div>
      </div>
      <SaveTripDialog open={saveOpen} onOpenChange={setSaveOpen} currentTrip={currentTrip} onSave={saveTrip} />
    </div>
  );
}
