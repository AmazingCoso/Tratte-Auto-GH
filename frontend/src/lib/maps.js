export const MODES = [
  { key: "driving", label: "Auto", testid: "btn-mode-car" },
  { key: "walking", label: "A piedi", testid: "btn-mode-walking" },
  { key: "bicycling", label: "In bici", testid: "btn-mode-biking" },
  { key: "transit", label: "Mezzi", testid: "btn-mode-transit" },
];

export const cleanStops = (waypoints) =>
  waypoints.map((w) => w.value.trim()).filter(Boolean);

export const buildMapsUrl = ({ origin, destination, waypoints, mode }) => {
  const params = new URLSearchParams({
    api: "1",
    origin: origin.trim(),
    destination: destination.trim(),
    travelmode: mode,
  });
  const stops = cleanStops(waypoints);
  // Transit mode in Google Maps does not support waypoints
  if (stops.length && mode !== "transit") params.set("waypoints", stops.join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

export const buildEmbedUrl = ({ origin, destination, waypoints }) => {
  const stops = [...cleanStops(waypoints), destination.trim()].filter(Boolean);
  const o = origin.trim();
  if (!o && !stops.length) return null;
  if (!o || !stops.length) {
    return `https://maps.google.com/maps?q=${encodeURIComponent(o || stops[0])}&output=embed`;
  }
  const daddr = stops.map(encodeURIComponent).join("+to:");
  return `https://maps.google.com/maps?saddr=${encodeURIComponent(o)}&daddr=${daddr}&output=embed`;
};

export const newWaypoint = (value = "") => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  value,
});

export const today = () => new Date().toISOString().slice(0, 10);

export const routeKey = (r) =>
  JSON.stringify([r.origin.trim(), r.destination.trim(), cleanStops(r.waypoints), r.mode]);

export const fmtKm = (km) => km.toLocaleString("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const fmtMin = (min) => {
  const t = Math.round(min);
  const h = Math.floor(t / 60);
  return h ? `${h} h ${String(t % 60).padStart(2, "0")} min` : `${t} min`;
};

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export const apiError = async (e, fallback) => {
  let d = e?.response?.data;
  if (d instanceof Blob) d = JSON.parse(await d.text());
  return typeof d?.detail === "string" ? d.detail : fallback;
};
