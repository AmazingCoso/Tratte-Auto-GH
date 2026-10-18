import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const KEY = "tratte-auto-profile";
const ProfileContext = createContext(null);

const applyHeader = (id) => {
  if (id) api.defaults.headers.common["X-Profile-Id"] = id;
  else delete api.defaults.headers.common["X-Profile-Id"];
};

let onProfileMissing = () => {};
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err?.response?.status === 404 && err.response.data?.detail === "Profilo non trovato") onProfileMissing();
    return Promise.reject(err);
  }
);

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentId, setCurrentId] = useState(() => {
    const id = localStorage.getItem(KEY);
    applyHeader(id);
    return id;
  });

  const select = useCallback((id) => {
    applyHeader(id);
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
    setCurrentId(id);
  }, []);

  const reload = useCallback(async () => {
    try {
      const { data } = await api.get("/profiles");
      setProfiles(data);
      return data;
    } catch {
      toast.error("Impossibile caricare i profili");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload().then((list) => {
      const saved = localStorage.getItem(KEY);
      if (saved && !list.some((p) => p.id === saved)) select(null);
    });
    onProfileMissing = () => {
      toast.error("Il profilo non esiste più");
      select(null);
      reload();
    };
  }, [reload, select]);

  const create = async (name) => {
    const { data } = await api.post("/profiles", { name });
    await reload();
    select(data.id);
  };

  const remove = async (id) => {
    await api.delete(`/profiles/${id}`);
    if (id === currentId) select(null);
    await reload();
  };

  const current = profiles.find((p) => p.id === currentId) || null;

  return (
    <ProfileContext.Provider value={{ profiles, loading, current, currentId, select, create, remove }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
