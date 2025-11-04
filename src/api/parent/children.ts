import api from "../client";

export type Sex = 0|1|2;                // 0=Unknown,1=Male,2=Female
export type SupportLevel = 0|1|2|3;     // 0..3

export type Child = {
  id: string;
  firstName: string;
  lastName?: string;
  birthDate?: string; // ISO UTC
  sex?: Sex;
  supportLevel?: SupportLevel;
  primaryDiagnosis?: string;
  nonVerbal?: boolean;
  communicationMethod?: string;
  allergies?: string;
  medications?: string;
  triggers?: string;
  calmingStrategies?: string;
  schoolOrCenter?: string;
  currentGoals?: string;
};

export async function listChildren() {
  const { data } = await api.get<Child[]>("/api/parent/children");
  return data;
}

export async function getChild(id: string) {
  const { data } = await api.get<Child>(`/api/parent/children/${id}`);
  return data;
}

export async function createChild(body: Partial<Child> & { firstName: string }) {
  const { data } = await api.post<Child>("/api/parent/children", body);
  return data;
}

export async function updateChild(id: string, body: Partial<Child>) {
  const { data } = await api.put<Child>(`/api/parent/children/${id}`, body);
  return data;
}

export async function deleteChild(id: string) {
  await api.delete(`/api/parent/children/${id}`);
}
