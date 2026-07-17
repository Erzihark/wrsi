import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import type { UploadAvatarFile } from '@wrsi/api';

/**
 * Prompt for a square profile photo and return it as upload-ready bytes, or
 * null if the student cancelled or declined the permission.
 *
 * Shared by the student's own photo and the admin's counselor-photo flow. Reads
 * the picked asset as base64 → ArrayBuffer, the same path `DocumentsScreen`
 * uses for Storage uploads.
 */
export async function pickAvatarFile(): Promise<UploadAvatarFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    // Avatars render in circles; a square crop keeps them from being cut off.
    aspect: [1, 1],
    quality: 0.7,
    base64: true,
  });
  if (result.canceled) return null;

  const asset = result.assets?.[0];
  if (!asset?.base64) return null;

  const contentType = asset.mimeType ?? 'image/jpeg';
  // `image/jpeg` -> `jpeg`; keeps the Storage key's extension honest.
  const ext = contentType.split('/')[1] ?? 'jpg';

  return { data: decode(asset.base64), contentType, ext };
}
