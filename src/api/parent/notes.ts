import api from "../client";

export type ChildNote = { id: string; text: string; createdAtUtc: string };

export async function listChildNotes(childId: string) {
  const { data } = await api.get<ChildNote[]>(`/api/parent/children/${childId}/notes`);
  return data;
}

export async function addChildNote(childId: string, text: string) {
  const { data } = await api.post<ChildNote>(`/api/parent/children/${childId}/notes`, { text });
  return data;
}
