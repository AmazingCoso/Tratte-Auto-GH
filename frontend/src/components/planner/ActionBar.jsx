import { Bookmark, Link2, Navigation, Share2 } from "lucide-react";

const secondary =
  "h-12 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:border-slate-300 hover:text-slate-900 active:scale-[0.98] transition-[transform,color,border-color]";

export const ActionBar = ({ onOpen, onCopy, onShare, onSave, isEditing }) => (
  <div className="fixed lg:static bottom-0 inset-x-0 z-40 p-3 lg:p-0 bg-white/90 lg:bg-transparent backdrop-blur-md lg:backdrop-blur-none border-t border-slate-200/80 lg:border-0">
    <div className="max-w-6xl mx-auto space-y-2">
      <button
        type="button"
        onClick={onOpen}
        data-testid="btn-open-google-maps"
        className="w-full h-14 flex items-center justify-center gap-2.5 rounded-xl bg-blue-600 text-white text-base font-semibold shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.99] transition-[transform,background-color]"
      >
        <Navigation className="w-5 h-5" /> Apri su Google Maps
      </button>
      <div className="grid grid-cols-3 gap-2">
        <button type="button" onClick={onSave} data-testid="btn-open-save-modal" className={secondary}>
          <Bookmark className="w-4 h-4" /> {isEditing ? "Aggiorna" : "Salva"}
        </button>
        <button type="button" onClick={onCopy} data-testid="btn-copy-route-link" className={secondary}>
          <Link2 className="w-4 h-4" /> Copia
        </button>
        <button type="button" onClick={onShare} data-testid="btn-share-route" className={secondary}>
          <Share2 className="w-4 h-4" /> Condividi
        </button>
      </div>
    </div>
  </div>
);
