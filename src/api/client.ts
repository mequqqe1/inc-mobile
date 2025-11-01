import axios from "axios";
import { storage } from "../utils/storage"; // ✅ используем универсальное хранилище

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE || "http://192.168.1.43:5062",
  timeout: 20000,
});

// ⬇️ В каждый запрос добавляем токен, если он есть
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem("accessToken"); // ✅ заменили SecureStore
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ⬇️ Если токен просрочен или невалиден — удаляем
api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error?.response?.status === 401) {
      await storage.deleteItem("accessToken"); // ✅ заменили SecureStore
    }
    throw error;
  }
);

// ⬇️ универсальный сеттер токена
export async function setToken(token: string | null) {
  if (token) {
    await storage.setItem("accessToken", token);
  } else {
    await storage.deleteItem("accessToken");
  }
}

export default api;
