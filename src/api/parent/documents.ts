import api from "../client";

export type ChildDocument = {
  id: string;
  fileName: string;
  contentType: "application/pdf";
  sizeBytes: number;
  createdAtUtc: string;
  uploadedByUserId: string;
};

export async function listDocuments(childId: string) {
  const { data } = await api.get<ChildDocument[]>(`/api/parent/children/${childId}/documents`);
  return data;
}

// contentBase64 — чистый base64 без data: префикса
export async function uploadPdf(childId: string, fileName: string, contentBase64: string, sizeBytes?: number) {
  const { data } = await api.post<ChildDocument>(`/api/parent/children/${childId}/documents`, {
    fileName, contentBase64, sizeBytes,
  });
  return data;
}

export async function downloadPdf(childId: string, docId: string) {
  const res = await api.get<ArrayBuffer>(`/api/parent/children/${childId}/documents/${docId}`, {
    responseType: "arraybuffer",
  });
  return res.data; // RN: можно сохранить через expo-file-system
}

export async function deleteDocument(childId: string, docId: string) {
  await api.delete(`/api/parent/children/${childId}/documents/${docId}`);
}
