import api from "./client";
import { PickedFile, buildForm } from "./form";

export type SpecialistProfile = {
  id: string;
  userId: string;
  about?: string;
  countryCode: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  region?: string;
  postalCode?: string;
  experienceYears?: number;
  pricePerHour?: number;
  telegram?: string;
  phone?: string;
  isEmailPublic: boolean;
  avatarMimeType?: string | null;
  status: number; // ModerationStatus
  moderationComment?: string | null;
  moderatedAtUtc?: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  specializationIds: number[];
  skillIds: number[];
};

// GET/PUT профиль
export async function getMyProfile() {
  const { data } = await api.get<SpecialistProfile>("/api/specialist/profile");
  return data;
}
export type UpsertProfileBody = {
  about?: string;
  countryCode: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  region?: string;
  postalCode?: string;
  experienceYears?: number;
  pricePerHour?: number;
  telegram?: string;
  phone?: string;
  isEmailPublic: boolean;
};
export async function saveMyProfile(body: UpsertProfileBody) {
  const { data } = await api.put<SpecialistProfile>("/api/specialist/profile", body);
  return data;
}

// Аватар multipart
export async function uploadAvatar(file: PickedFile) {
  const fd = buildForm("file", file);
  const { data } = await api.put<SpecialistProfile>("/api/specialist/profile/avatar-upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

// Дипломы
export type Diploma = { id: string; title?: string; fileName?: string; mimeType?: string; uploadedAtUtc: string };

export async function uploadDiploma(file: PickedFile, title?: string, fileName?: string) {
  const fd = buildForm("file", file);
  if (title) fd.append("title", title);
  if (fileName) fd.append("fileName", fileName);
  const { data } = await api.post<Diploma>("/api/specialist/profile/diplomas/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
export async function myDiplomas() {
  const { data } = await api.get<Diploma[]>("/api/specialist/profile/diplomas");
  return data;
}
export async function deleteDiploma(id: string) {
  await api.delete(`/api/specialist/profile/diplomas/${id}`);
}

// Выбор таксономий
export async function setSpecializations(ids: number[]) {
  await api.put("/api/specialist/profile/specializations", { specializationIds: ids });
}
export async function setSkills(ids: number[]) {
  await api.put("/api/specialist/profile/skills", { skillIds: ids });
}


export type SpecialistCatalogItem = {
  userId: string;
  fullName: string;
  city: string;
  pricePerHour?: number;
  about?: string;
  specializations: string[];
  skills: string[];
  hasAvatar: boolean;
};

export type SpecialistPublicProfile = {
  userId: string;
  fullName: string;
  city: string;
  about?: string;
  pricePerHour?: number;
  telegram?: string;
  phone?: string;
  specializations: string[];
  skills: string[];
  hasAvatar: boolean;
};

export type AvailabilitySlot = {
  id: string;
  startsAtUtc: string;
  endsAtUtc: string;
  isBooked: boolean;
  note?: string;
};

// ====== API ======

export async function getSpecialists(params?: {
  city?: string;
  specializationId?: number;
  skillId?: number;
  q?: string;
}) {
  const { data } = await api.get<SpecialistCatalogItem[]>("/api/specialists", {
    params,
  });
  return data;
}

export async function getSpecialistProfile(userId: string) {
  const { data } = await api.get<SpecialistPublicProfile>(
    `/api/specialists/${userId}`
  );
  return data;
}

export async function getAvailability(
  userId: string,
  fromUtc: string,
  toUtc: string
) {
  const { data } = await api.get<AvailabilitySlot[]>(
    `/api/specialists/${userId}/availability`,
    { params: { fromUtc, toUtc } }
  );
  return data;
}
