import { useState } from "react";
import { Star } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFavorites } from "@/lib/favorites";

export const FavoritePicker = ({ onPick, testid }) => {
  const { places } = useFavorites();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = places.filter((p) => `${p.name} ${p.address}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" data-testid={testid} aria-label="Scegli dai preferiti" className="h-7 px-2 flex items-center gap-1 rounded-lg text-[11px] font-semibold text-amber-600 hover:bg-amber-50 transition-colors">
          <Star className="w-3.5 h-3.5" /> Preferiti
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(320px,calc(100vw-32px))] p-2 rounded-xl" data-testid={`${testid}-list`}>
        {places.length === 0 ? (
          <p className="p-3 text-sm text-slate-500">Nessun luogo preferito. Aggiungili dal riquadro "Luoghi preferiti".</p>
        ) : (
          <>
            {places.length > 5 && (
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cerca preferito" data-testid={`${testid}-search`} className="w-full h-9 px-3 mb-1 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-900" />
            )}
            <ul className="max-h-72 overflow-y-auto">
              {list.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onPick(p.address);
                      setOpen(false);
                    }}
                    data-testid={`${testid}-item-${p.id}`}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50"
                  >
                    <div className="text-sm font-medium text-slate-900">{p.name}</div>
                    <div className="text-xs text-slate-500 break-words">{p.address}</div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
