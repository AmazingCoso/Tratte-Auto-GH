import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const SaveTripDialog = ({ open, onOpenChange, currentTrip, onSave }) => {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(currentTrip?.name || "");
      setNotes(currentTrip?.notes || "");
    }
  }, [open, currentTrip]);

  const submit = async (asNew) => {
    if (!name.trim()) return;
    setBusy(true);
    await onSave({ name: name.trim(), notes }, asNew);
    setBusy(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md" data-testid="save-trip-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{currentTrip ? "Aggiorna viaggio" : "Salva viaggio"}</DialogTitle>
          <DialogDescription>Dai un nome al percorso e aggiungi note utili.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit(false);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="trip-name">Nome</Label>
            <Input id="trip-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Giro clienti Brianza" className="h-12 rounded-xl" data-testid="input-trip-name" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="trip-notes">Note</Label>
            <Textarea id="trip-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Orari, contatti, promemoria…" rows={4} className="rounded-xl" data-testid="input-trip-notes" />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            {currentTrip && (
              <button type="button" disabled={busy || !name.trim()} onClick={() => submit(true)} data-testid="btn-save-as-new-trip" className="h-12 px-5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-slate-300 disabled:opacity-50 transition-colors">
                Salva come nuovo
              </button>
            )}
            <button type="submit" disabled={busy || !name.trim()} data-testid="btn-submit-save-trip" className="h-12 px-6 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {busy ? "Salvataggio…" : currentTrip ? "Aggiorna" : "Salva viaggio"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
