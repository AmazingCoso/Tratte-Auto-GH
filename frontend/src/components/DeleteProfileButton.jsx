import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const DeleteProfileButton = ({ profile, onConfirm }) => {
  const [typed, setTyped] = useState("");
  const ok = typed.trim().toLowerCase() === profile.name.trim().toLowerCase();

  return (
    <AlertDialog onOpenChange={(o) => !o && setTyped("")}>
      <AlertDialogTrigger asChild>
        <button type="button" aria-label="Elimina profilo" data-testid={`btn-delete-profile-${profile.id}`} className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent className="w-[calc(100%-2rem)] rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare il profilo "{profile.name}"?</AlertDialogTitle>
          <AlertDialogDescription>
            Verranno eliminati anche tutti i suoi viaggi salvati e non si potranno recuperare. Per confermare scrivi il nome del profilo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={profile.name}
          data-testid="input-confirm-delete-profile"
          className="w-full h-12 px-4 rounded-xl border border-slate-200 text-base focus:outline-none focus:border-red-500"
        />
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="btn-cancel-delete-profile">Annulla</AlertDialogCancel>
          <AlertDialogAction disabled={!ok} onClick={onConfirm} className="bg-red-600 hover:bg-red-700 disabled:opacity-40" data-testid="btn-confirm-delete-profile">
            Elimina
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
