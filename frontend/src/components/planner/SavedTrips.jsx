import { Search, Route } from "lucide-react";
import { TripCard } from "@/components/planner/TripCard";

export const SavedTrips = ({ trips, loading, search, onSearch, currentId, onLoad, onDuplicate, onDelete }) => (
  <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 sm:p-5" data-testid="saved-trips-panel">
    <div className="flex items-baseline justify-between mb-3">
      <h2 className="font-heading text-lg font-semibold">Viaggi salvati</h2>
      <span className="font-mono-ui text-xs text-slate-400" data-testid="saved-trips-count">{trips.length}</span>
    </div>
    <div className="relative mb-4">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Cerca per nome, luogo o note"
        data-testid="input-search-saved-trips"
        className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/60 text-sm focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
      />
    </div>
    <TripsBody trips={trips} loading={loading} search={search} currentId={currentId} onLoad={onLoad} onDuplicate={onDuplicate} onDelete={onDelete} />
  </div>
);

const TripsBody = ({ trips, loading, search, currentId, onLoad, onDuplicate, onDelete }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
      </div>
    );
  }
  if (trips.length === 0) {
    return (
      <div className="py-10 flex flex-col items-center text-center text-slate-400 gap-2" data-testid="saved-trips-empty">
        <Route className="w-7 h-7" />
        <p className="text-sm">{search ? "Nessun viaggio trovato." : "Nessun viaggio salvato. Componi un percorso e premi Calcola tratte."}</p>
      </div>
    );
  }
  return (
    <ul className="space-y-2 max-h-[520px] overflow-y-auto -mr-1 pr-1">
      {trips.map((t) => (
        <TripCard key={t.id} trip={t} active={t.id === currentId} onLoad={onLoad} onDuplicate={onDuplicate} onDelete={onDelete} />
      ))}
    </ul>
  );
};
