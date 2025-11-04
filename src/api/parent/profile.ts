import api from "../client";

export type ParentProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  countryCode: string;
  city?: string;
  addressLine1?: string;
  addressLine2?: string;
  phone?: string;
};

// 404 = профиля нет
export async function getParentProfile(): Promise<ParentProfile | null> {
  try {
    const { data } = await api.get<ParentProfile>("/api/parent/profile");
    return data;
  } catch (e: any) {
    if (e?.response?.status === 404) return null;
    throw e;
  }
}

export type UpsertParentProfileBody = Omit<ParentProfile, "id" | "userId">;

export async function upsertParentProfile(body: UpsertParentProfileBody) {
  const { data } = await api.post<ParentProfile>("/api/parent/profile", body);
  return data;
}
