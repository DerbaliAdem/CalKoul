import { File, Paths } from "expo-file-system";
import { Platform } from "react-native";

export async function saveProfilePhoto(sourceUri: string, base64?: string | null): Promise<string> {
  if (Platform.OS === "web") {
    if (base64) return `data:image/jpeg;base64,${base64}`;
    return sourceUri;
  }
  const source = new File(sourceUri);
  const extension = source.extension && source.extension.length < 8 ? source.extension : ".jpg";
  const destination = new File(Paths.document, `calkoul-profile-${Date.now()}${extension}`);
  await source.copy(destination);
  return destination.uri;
}

export function removeStoredProfilePhoto(uri: string): void {
  if (Platform.OS === "web" || !uri.startsWith(Paths.document.uri)) return;
  try { new File(uri).delete(); } catch { /* The profile may point to a file removed by the user. */ }
}
