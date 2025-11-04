import api from "../client";

export type CaregiverStatus = 0|1|2; // 0=Pending? (в доке списком), 1=Active, 2=Revoked
export type Caregiver = {
  id: string;
  email: string;
  userId?: string | null;
  relation?: string;
  isAdmin: boolean;
  status: CaregiverStatus;
  invitedAtUtc?: string;
  acceptedAtUtc?: string;
  revokedAtUtc?: string;
};

export async function listCaregivers() {
  const { data } = await api.get<Caregiver[]>("/api/parent/caregivers");
  return data;
}

export async function inviteCaregiver(email: string, relation: string, isAdmin = false) {
  const { data } = await api.post<Caregiver>("/api/parent/caregivers/invite", { email, relation, isAdmin });
  return data;
}

export async function acceptInvite(memberId: string) {
  await api.post(`/api/parent/caregivers/${memberId}/accept`, {});
}

export async function updateCaregiver(memberId: string, patch: Partial<Pick<Caregiver,"relation"|"isAdmin"|"status">>) {
  const { data } = await api.put<Caregiver>(`/api/parent/caregivers/${memberId}`, patch);
  return data;
}

export async function removeCaregiver(memberId: string) {
  await api.delete(`/api/parent/caregivers/${memberId}`);
}
