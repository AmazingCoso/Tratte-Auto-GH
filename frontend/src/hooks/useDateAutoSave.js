import { useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const sameDates = (trip, route) =>
  trip.date === route.date && JSON.stringify(trip.leg_dates || []) === JSON.stringify(route.legDates);

export const useDateAutoSave = ({ currentTrip, route, onSaved }) => {
  const { date, legDates } = route;

  useEffect(() => {
    if (!currentTrip || sameDates(currentTrip, { date, legDates })) return;
    const t = setTimeout(async () => {
      try {
        const { data } = await api.patch(`/trips/${currentTrip.id}/dates`, { date, leg_dates: legDates });
        toast.success("Data salvata");
        onSaved(data);
      } catch {
        toast.error("Salvataggio della data non riuscito");
      }
    }, 700);
    return () => clearTimeout(t);
  }, [date, legDates, currentTrip, onSaved]);
};
