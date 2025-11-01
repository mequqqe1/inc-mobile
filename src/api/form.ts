export type PickedFile = { uri: string; name: string; type: string };

// Принимаем fileName/mimeType с null | undefined
type AssetLike = { uri: string; fileName?: string | null; mimeType?: string | null };

export function fileFromAsset(asset: AssetLike): PickedFile {
  const name = asset.fileName ?? asset.uri.split("/").pop() ?? "upload.bin";
  const type = asset.mimeType ?? "application/octet-stream";
  return { uri: asset.uri, name, type };
}

export function buildForm(field: string, file: PickedFile): FormData {
  const fd = new FormData();
  // @ts-ignore — React Native требует именно объект { uri, name, type }
  fd.append(field, { uri: file.uri, name: file.name, type: file.type });
  return fd;
}
