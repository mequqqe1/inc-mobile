// api/parent/tracker.ts
import api from "../client";

export type DayVM = {
  id?: string|null;
  date: string; // DateOnly на бэке, сюда придёт "2025-11-08" или ISO-с датой
  sleepTotalHours?: number|null;
  sleepLatencyMin?: number|null;
  nightWakings?: number|null;
  sleepQuality?: number|null;
  mood: number;
  anxiety?: number|null;
  sensoryOverload: boolean;
  mealsCount?: number|null;
  appetite: number;
  dietNotes?: string|null;
  communicationLevel?: string|null;
  newSkillObserved?: string|null;
  toiletingStatus: number;
  selfCareDressing?: boolean|null;
  selfCareHygiene?: boolean|null;
  homeTasksDone?: boolean|null;
  rewardUsed?: boolean|null;
  triggers: string[];
  environmentChanges: string[];
  parentNote?: string|null;
  incidentsCount: number;
  incidents: {
    id: string; timeUtc: string; intensity: number; durationSec?: number|null; injury: boolean;
    antecedent: string[]; behavior: string[]; consequence: string[]; notes?: string|null;
  }[];
  medIntakes: {
    id: string; drug: string; dose?: string|null; timeUtc: string; taken: boolean; sideEffects: string[];
  }[];
  sessions: {
    id: string; type: string; durationMin: number; quality?: number|null; goalTags: string[]; notes?: string|null;
  }[];
};

export type DayMarker = { date: string; hasEntry: boolean; incidentsCount: number };

export async function getDay(childId: string, dateUtc: string) {
  const { data } = await api.get<DayVM>(`/api/parent/children/${childId}/tracker/day`, {
    params: { dateUtc }
  });
  return data;
}

export async function upsertDay(childId: string, body: any) {
  await api.post(`/api/parent/children/${childId}/tracker/day`, body);
}

export async function getDays(childId: string, fromUtc: string, toUtc: string) {
  const { data } = await api.get<DayMarker[]>(`/api/parent/children/${childId}/tracker/days`, {
    params: { fromUtc, toUtc }
  });
  return data;
}

export async function addIncident(childId: string, dateUtc: string, body: {
  timeUtc: string; intensity: number; durationSec?: number; injury: boolean;
  antecedent?: string[]; behavior?: string[]; consequence?: string[]; notes?: string;
}) {
  const { data } = await api.post<{id:string}>(`/api/parent/children/${childId}/tracker/incidents`, body, { params: { dateUtc } });
  return data.id;
}
export async function updateIncident(childId: string, id: string, body: any) {
  await api.patch(`/api/parent/children/${childId}/tracker/incidents/${id}`, body);
}
export async function deleteIncident(childId: string, id: string) {
  await api.delete(`/api/parent/children/${childId}/tracker/incidents/${id}`);
}

export async function addMed(childId: string, dateUtc: string, body: {
  drug: string; dose?: string; timeUtc: string; taken: boolean; sideEffects?: string[];
}) {
  const { data } = await api.post<{id:string}>(`/api/parent/children/${childId}/tracker/med-intakes`, body, { params: { dateUtc } });
  return data.id;
}
export async function updateMed(childId: string, id: string, body: any) {
  await api.patch(`/api/parent/children/${childId}/tracker/med-intakes/${id}`, body);
}
export async function deleteMed(childId: string, id: string) {
  await api.delete(`/api/parent/children/${childId}/tracker/med-intakes/${id}`);
}

export async function addSession(childId: string, dateUtc: string, body: {
  type: string; durationMin: number; quality?: number; goalTags?: string[]; notes?: string;
}) {
  const { data } = await api.post<{id:string}>(`/api/parent/children/${childId}/tracker/sessions`, body, { params: { dateUtc } });
  return data.id;
}
export async function updateSession(childId: string, id: string, body: any) {
  await api.patch(`/api/parent/children/${childId}/tracker/sessions/${id}`, body);
}
export async function deleteSession(childId: string, id: string) {
  await api.delete(`/api/parent/children/${childId}/tracker/sessions/${id}`);
}

export async function getWeek(childId: string, weekStartUtc: string) {
  const { data } = await api.get(`/api/parent/children/${childId}/tracker/summary/week`, { params: { weekStartUtc } });
  return data;
}
export async function getMonth(childId: string, year: number, month: number) {
  const { data } = await api.get(`/api/parent/children/${childId}/tracker/summary/month`, { params: { year, month } });
  return data as { daysWithEntries: number; avgSleep: number; incidents: number };
}
export async function getPresets() {
  const { data } = await api.get(`/api/parent/children/00000000-0000-0000-0000-000000000000/tracker/presets`); // AllowAnonymous — childId не важен
  return data as { antecedent: string[]; behavior: string[]; consequence: string[]; triggers: string[]; environments: string[]; sessionTypes: string[] };
}
