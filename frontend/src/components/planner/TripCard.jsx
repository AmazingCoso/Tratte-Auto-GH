import { ArrowRight, Copy, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MODES, fmtKm } from "@/lib/maps";

const iconBtn = "w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors";

export const TripCard = ({ trip, active, onLoad, onDuplicate, onDelete }) => {
  const mode = MODES.find((m) => m.key === trip.mode)?.label;
  const date = new Date(`${trip.date}T00:00:00`).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });

  return (
    <li
      data-testid={`card-saved-trip-${trip.id}`}
      className={`group rounded-xl border p-3.5 transition-colors ${active ? "border-blue-500 bg-blue-50/40" : "border-slate-200 hover:border-slate-300"}`}
    >
      <div className="flex items-start gap-3">
        <button type="button" onClick={() => onLoad(trip)} data-testid={`btn-load-saved-trip-${trip.id}`} className="flex-1 min-w-0 text-left">
          <div className="font-medium text-slate-900 truncate">{trip.name}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
            <span className="truncate max-w-[40%]">{trip.origin}</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
            <span className="truncate">{trip.destination}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{mode}</span>
            {trip.waypoints.length > 0 && <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{trip.waypoints.length} tappe</span>}
            {trip.total_km != null && (
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-mono-ui" data-testid={`saved-trip-km-${trip.id}`}>{fmtKm(trip.total_km)} km</span>
            )}
            <span className="font-mono-ui text-slate-400">{date}</span>
          </div>
          {trip.notes && <p className="mt-2 text-xs text-slate-500 line-clamp-2">{trip.notes}</p>}
        </button>
        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row">
          <button type="button" onClick={() => onLoad(trip)} className={iconBtn} aria-label="Modifica" data-testid={`btn-edit-saved-trip-${trip.id}`}>
            <Pencil className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => onDuplicate(trip)} className={iconBtn} aria-label="Duplica" data-testid={`btn-duplicate-saved-trip-${trip.id}`}>
            <Copy className="w-4 h-4" />
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button type="button" className={`${iconBtn} hover:!text-red-600 hover:!bg-red-50`} aria-label="Elimina" data-testid={`btn-delete-saved-trip-${trip.id}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminare "{trip.name}"?</AlertDialogTitle>
                <AlertDialogDescription>L'operazione non può essere annullata.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="btn-cancel-delete-trip">Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(trip)} className="bg-red-600 hover:bg-red-700" data-testid="btn-confirm-delete-trip">
                  Elimina
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </li>
  );
};
