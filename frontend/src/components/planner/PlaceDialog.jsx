import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AddressInput } from "@/components/planner/AddressInput";
import { GpsButton } from "@/components/planner/GpsButton";
import { useFavorites } from "@/lib/favorites";

export const PlaceDialog = ({ open, onOpenChange, place }) => {
  const { save } = useFavorites();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(place?.name || "");
      setAddress(place?.address || "");
    }
  }, [open, place]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    setBusy(true);
    try {
      await save({ name: name.trim(), address: address.trim() }, place?.id);
      toast.success(place ? "Luogo aggiornato" : "Luogo aggiunto ai preferiti");
      onOpenChange(false);
    } catch {
      toast.error("Salvataggio non riuscito");
    } finally {
      setBusy(false);
    }
  };

  const idleLabel = place ? "Aggiorna" : "Aggiungi";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] rounded-2xl sm:max-w-md" data-testid="place-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">{place ? "Modifica luogo" : "Nuovo luogo preferito"}</DialogTitle>
          <DialogDescription>Dai un nome al luogo e indica il suo indirizzo.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="place-name">Nome</Label>
            <Input id="place-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Ufficio, Cliente Rossi" className="h-12 rounded-xl" data-testid="input-place-name" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label>Indirizzo</Label>
            <div className="flex items-start gap-2">
              <AddressInput inline value={address} onChange={setAddress} placeholder="Indirizzo o coordinate GPS" testid="input-place-address" />
              <GpsButton testid="btn-gps-place" onLocated={setAddress} />
            </div>
          </div>
          <DialogFooter>
            <button type="submit" disabled={busy || !name.trim() || !address.trim()} data-testid="btn-submit-place" className="h-12 px-6 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {busy ? "Salvataggio…" : idleLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
