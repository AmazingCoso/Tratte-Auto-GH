import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const FavoritesContext = createContext({ places: [] });

export const FavoritesProvider = ({ children }) => {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const { data } = await api.get("/places");
      setPlaces(data);
    } catch {
      toast.error("Impossibile caricare i luoghi preferiti");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = async (place, id) => {
    if (id) await api.put(`/places/${id}`, place);
    else await api.post("/places", place);
    await reload();
  };

  const remove = async (id) => {
    await api.delete(`/places/${id}`);
    await reload();
  };

  return <FavoritesContext.Provider value={{ places, loading, save, remove }}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => useContext(FavoritesContext);

export const matchFavorites = (places, q) => {
  const s = q.trim().toLowerCase();
  if (s.length < 2) return [];
  return places.filter((p) => p.name.toLowerCase().includes(s) || p.address.toLowerCase().includes(s)).slice(0, 3);
};
