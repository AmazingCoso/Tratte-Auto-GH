import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export const useSavedTrips = () => {
  const [trips, setTrips] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchTrips = useCallback(async (q) => {
    try {
      const { data } = await api.get("/trips", { params: q ? { q } : {} });
      setTrips(data);
    } catch {
      toast.error("Impossibile caricare i viaggi salvati");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchTrips(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search, fetchTrips]);

  const refresh = useCallback(() => fetchTrips(search.trim()), [fetchTrips, search]);

  const duplicateTrip = async (trip) => {
    try {
      await api.post(`/trips/${trip.id}/duplicate`);
      toast.success("Viaggio duplicato");
      refresh();
    } catch {
      toast.error("Duplicazione non riuscita");
    }
  };

  const deleteTrip = async (trip) => {
    try {
      await api.delete(`/trips/${trip.id}`);
      toast.success("Viaggio eliminato");
      refresh();
      return true;
    } catch {
      toast.error("Eliminazione non riuscita");
      return false;
    }
  };

  return { trips, search, setSearch, loading, refresh, duplicateTrip, deleteTrip };
};
