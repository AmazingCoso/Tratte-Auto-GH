import { useState } from "react";
import { toast } from "sonner";
import { Compass, Loader2, Plus } from "lucide-react";
import { DeleteProfileButton } from "@/components/DeleteProfileButton";
import { useProfile } from "@/lib/profile";

const COLORS = ["bg-blue-600", "bg-emerald-600", "bg-amber-500", "bg-rose-500", "bg-violet-600", "bg-cyan-600"];

export const ProfileGate = () => {
  const { profiles, loading, select, create, remove } = useProfile();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await create(name.trim());
      toast.success(`Profilo "${name.trim()}" creato`);
    } catch {
      toast.error("Creazione profilo non riuscita");
    } finally {
      setBusy(false);
    }
  };

  const del = async (p) => {
    try {
      await remove(p.id);
      toast.success(`Profilo "${p.name}" eliminato`);
    } catch {
      toast.error("Eliminazione non riuscita");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex items-start sm:items-center justify-center px-4 py-10">
      <div className="w-full max-w-md fade-up" data-testid="profile-gate">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.18em] uppercase text-slate-500 mb-3">
          <Compass className="w-4 h-4 text-blue-600" /> Tratte Auto
        </div>
        <h1 className="font-heading text-4xl sm:text-5xl font-bold tracking-tight">Chi sei?</h1>
        <p className="mt-2 text-sm sm:text-base text-slate-500">Scegli il tuo profilo: ognuno ha i suoi viaggi, i suoi luoghi preferiti e il suo report mensile.</p>

        <div className="mt-8 bg-white border border-slate-200/80 shadow-sm rounded-2xl p-3 sm:p-4">
          {loading ? (
            <div className="py-8 flex justify-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : profiles.length === 0 ? (
            <p className="p-4 text-sm text-slate-500" data-testid="profiles-empty">Nessun profilo ancora. Crea il primo qui sotto.</p>
          ) : (
            <ul className="space-y-1">
              {profiles.map((p, i) => (
                <li key={p.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => select(p.id)}
                    data-testid={`btn-select-profile-${p.id}`}
                    className="flex-1 min-w-0 flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-slate-50 transition-colors"
                  >
                    <span className={`w-11 h-11 shrink-0 rounded-full ${COLORS[i % COLORS.length]} text-white font-heading text-lg font-semibold flex items-center justify-center`}>
                      {p.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="font-medium text-slate-900 truncate">{p.name}</span>
                  </button>
                  <DeleteProfileButton profile={p} onConfirm={() => del(p)} />
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={submit} className="mt-2 pt-3 border-t border-slate-100 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome nuovo profilo"
              maxLength={40}
              data-testid="input-new-profile-name"
              className="flex-1 min-w-0 h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/60 text-base focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
            />
            <button type="submit" disabled={busy || !name.trim()} data-testid="btn-create-profile" className="h-12 px-4 flex items-center gap-1.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Crea
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
