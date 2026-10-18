import { useEffect, useState } from "react";
import { MapPinned } from "lucide-react";
import { buildEmbedUrl } from "@/lib/maps";

export const MapPreview = ({ route }) => {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setSrc(buildEmbedUrl(route)), 900);
    return () => clearTimeout(t);
  }, [route]);

  return (
    <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl overflow-hidden" data-testid="map-preview">
      <div className="px-4 sm:px-5 pt-4 pb-3 text-xs font-semibold tracking-wider uppercase text-slate-500">Anteprima mappa</div>
      <div className="aspect-[4/3] bg-slate-100 grain">
        {src ? (
          <iframe title="Anteprima percorso" src={src} className="w-full h-full border-0" loading="lazy" data-testid="map-preview-iframe" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-400 px-6 text-center">
            <MapPinned className="w-8 h-8" />
            <p className="text-sm">Inserisci partenza e destinazione per vedere l'anteprima del percorso.</p>
          </div>
        )}
      </div>
    </div>
  );
};
