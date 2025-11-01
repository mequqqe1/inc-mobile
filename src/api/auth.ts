import api, { setToken } from "./client";

export type AuthResponse = {
  accessToken: string;
  expiresAtUtc: string;
  userId: string;
  email: string;
  fullName?: string;
  roles: string[];
};

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password });
  await setToken(data.accessToken);
  return data;
}

export async function register(email: string, password: string, role: "Specialist"|"Parent", fullName?: string) {
  const { data } = await api.post<AuthResponse>("/api/auth/register", { email, password, role, fullName });
  await setToken(data.accessToken);
  return data;
}

export async function me() {
  const { data } = await api.get<{ id: string; email: string; fullName?: string; roles: string[] }>("/api/auth/me");
  return data;
}

export async function logout() {
  await setToken(null);
}
