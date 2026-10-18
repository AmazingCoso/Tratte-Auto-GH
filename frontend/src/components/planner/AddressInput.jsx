import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { api } from "@/lib/api";

export const AddressInput = ({ value, onChange, placeholder, testid }) => {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current || value.trim().length < 3) return setItems([]);
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/route/suggest", { params: { q: value } });
        if (alive) setItems(data);
      } catch {
        if (alive) setItems([]);
      }
    }, 350);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [value]);

  const pick = (label) => {
    typed.current = false;
    onChange(label);
    setItems([]);
    setOpen(false);
  };

  return (
    <div className="flex-1 min-w-0">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          typed.current = true;
          setOpen(true);
          onChange(e.target.value);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        data-testid={testid}
        autoComplete="off"
        className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/60 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5 transition-colors"
      />
      {open && items.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1.5 max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg" data-testid={`${testid}-suggestions`}>
          {items.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(label);
                }}
                data-testid={`${testid}-suggestion-${i}`}
                className="w-full flex items-start gap-2 px-3.5 py-3 text-left text-sm leading-snug text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0"
              >
                <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                <span className="break-words">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
