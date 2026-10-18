import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { PlaceDialog } from "@/components/planner/PlaceDialog";

const iconBtn = "w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors";

export const FavoritesPanel = () => {
  const { places, loading, remove } = useFavorites();
  const [dialog, setDialog] = useState({ open: false, place: null });

  const del = async (p) => {
    try {
      await remove(p.id);
      toast.success("Luogo eliminato");
    } catch {
      toast.error("Eliminazione non riuscita");
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-4 sm:p-5" data-testid="favorites-panel">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-heading text-lg font-semibold flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500" /> Luoghi preferiti
        </h2>
        <button type="button" onClick={() => setDialog({ open: true, place: null })} data-testid="btn-add-place" className="h-9 px-3 flex items-center gap-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
          <Plus className="w-4 h-4" /> Aggiungi
        </button>
      </div>
      {!loading && places.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400" data-testid="favorites-empty">Nessun luogo preferito. Aggiungi clienti, sedi o negozi che visiti spesso.</p>
      ) : (
        <ul className="space-y-1 max-h-80 overflow-y-auto -mr-1 pr-1">
          {places.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-50" data-testid={`place-item-${p.id}`}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{p.name}</div>
                <div className="text-xs text-slate-500 truncate">{p.address}</div>
              </div>
              <button type="button" onClick={() => setDialog({ open: true, place: p })} className={iconBtn} aria-label="Modifica" data-testid={`btn-edit-place-${p.id}`}>
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => del(p)} className={`${iconBtn} hover:!text-red-600 hover:!bg-red-50`} aria-label="Elimina" data-testid={`btn-delete-place-${p.id}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <PlaceDialog open={dialog.open} place={dialog.place} onOpenChange={(open) => setDialog((d) => ({ ...d, open }))} />
    </div>
  );
};
