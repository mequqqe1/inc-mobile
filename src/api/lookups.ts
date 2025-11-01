import api from "./client";

export type LookupItem = { id: number; name: string; description?: string; sortOrder: number; isActive: boolean };

export async function getSpecializations() {
  const { data } = await api.get<LookupItem[]>("/api/lookups/specializations");
  return data;
}
export async function getSkills() {
  const { data } = await api.get<LookupItem[]>("/api/lookups/skills");
  return data;
}
