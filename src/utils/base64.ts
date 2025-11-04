// В Expo проще всего использовать expo-file-system + Buffer из 'base64-arraybuffer' при необходимости
import * as FileSystem from "expo-file-system";

// Читает файл и возвращает ЧИСТЫЙ base64 (без data:application/pdf;base64,)
export async function fileToBase64(uri: string) {
  const b64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  return b64;
}
