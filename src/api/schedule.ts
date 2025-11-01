import api from "./client";

export type PresetInfo = { code: string; name: string; slotMinutes: number };
export type BreakDto = { from: string; to: string };
export type WeeklyTemplateSlotDto = { dayOfWeek: number; startLocalTime: string; endLocalTime: string; note?: string };
export type WeeklyTemplateResponse = { id: string; isActive: boolean; slots: WeeklyTemplateSlotDto[] };

export async function getPresets() {
  const { data } = await api.get<PresetInfo[]>("/api/specialist/schedule-template/presets");
  return data;
}
export async function generateFromPreset(req: {
  presetCode: string;
  daysOfWeek?: number[];
  startLocalTime: string; // "10:00:00"
  endLocalTime: string;   // "18:00:00"
  slotMinutes?: number;
  breaks?: BreakDto[];
  note?: string;
  isActive?: boolean;
}) {
  const { data } = await api.post<WeeklyTemplateResponse>("/api/specialist/schedule-template/from-preset", req);
  return data;
}
export async function getTemplate() {
  const { data } = await api.get<WeeklyTemplateResponse>("/api/specialist/schedule-template");
  return data;
}
export async function upsertTemplate(body: { slots: WeeklyTemplateSlotDto[]; isActive: boolean }) {
  const { data } = await api.put<WeeklyTemplateResponse>("/api/specialist/schedule-template", body);
  return data;
}
export async function materializeTemplate(fromDateUtc: string, toDateUtc: string, skipPast = true) {
  const { data } = await api.post<{ created: number; skipped: number }>(
    "/api/specialist/schedule-template/materialize",
    { fromDateUtc, toDateUtc, skipPast }
  );
  return data;
}

// Availability CRUD (для спеца)
export type AvailabilitySlot = { id: string; startsAtUtc: string; endsAtUtc: string; isBooked: boolean; note?: string };

export async function createSlots(slots: { startsAtUtc: string; endsAtUtc: string; note?: string }[]) {
  const { data } = await api.post<AvailabilitySlot[]>("/api/specialist/availability", { slots });
  return data;
}
export async function mySlots(fromUtc: string, toUtc: string) {
  const { data } = await api.get<AvailabilitySlot[]>(`/api/specialist/availability?fromUtc=${fromUtc}&toUtc=${toUtc}`);
  return data;
}
export async function deleteSlot(id: string) {
  await api.delete(`/api/specialist/availability/${id}`);
}
