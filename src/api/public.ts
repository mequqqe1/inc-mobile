import api from "./client";
import { AvailabilitySlot } from "./schedule";

export async function freeSlotsOfSpecialist(specialistUserId: string, fromUtc: string, toUtc: string) {
  const { data } = await api.get<AvailabilitySlot[]>(
    `/api/specialists/${specialistUserId}/availability?fromUtc=${fromUtc}&toUtc=${toUtc}`
  );
  return data;
}
