import { useState } from "react";
import { toast } from "sonner";
import { Crosshair, Loader2 } from "lucide-react";

export const GpsButton = ({ onLocated, testid }) => {
  const [locating, setLocating] = useState(false);

  const getGPS = () => {
    if (!navigator.geolocation) return toast.error("Geolocalizzazione non supportata.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        onLocated(`${coords.latitude.toFixed(6)},${coords.longitude.toFixed(6)}`);
        setLocating(false);
        toast.success("Posizione GPS rilevata");
      },
      (err) => {
        setLocating(false);
        toast.error(`Errore GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <button
      type="button"
      onClick={getGPS}
      disabled={locating}
      data-testid={testid}
      className="shrink-0 h-12 px-3.5 flex items-center gap-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-semibold hover:bg-blue-100 disabled:opacity-60 transition-colors"
    >
      {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
      <span>{locating ? "Rilevo…" : "GPS"}</span>
    </button>
  );
};
