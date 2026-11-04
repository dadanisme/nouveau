import { Directory, File, Paths } from 'expo-file-system';

const UNITS = ['B', 'KB', 'MB', 'GB'] as const;

export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null || bytes < 0) return 'Unknown size';
  if (bytes === 0) return '0 B';

  let unitIndex = 0;
  let size = bytes;
  while (size >= 1024 && unitIndex < UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${unitIndex === 0 ? size : size.toFixed(1)} ${UNITS[unitIndex]}`;
}

export async function readFileAsBase64(uri: string): Promise<string> {
  const file = new File(uri);
  return file.base64();
}

export async function downloadToTempFile(remoteUrl: string, filename: string): Promise<File> {
  const destination = new Directory(Paths.cache, 'proof-downloads');
  if (!destination.exists) {
    destination.create();
  }
  const destinationFile = new File(destination, filename);
  if (destinationFile.exists) {
    destinationFile.delete();
  }
  return File.downloadFileAsync(remoteUrl, destinationFile);
}

export function cleanupTempDownloads(): void {
  const dir = new Directory(Paths.cache, 'proof-downloads');
  if (dir.exists) {
    dir.delete();
  }
}

export function isSaveableImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/** "1.2 MB · 1170×2532" for an image, "1.2 MB" when the dimensions are unknown. */
export function formatImageMeta(
  bytes: number | null | undefined,
  width: number | null | undefined,
  height: number | null | undefined,
): string {
  const size = formatFileSize(bytes);
  return width != null && height != null ? `${size} · ${width}×${height}` : size;
}

/** A `file://` URI for a local path; URIs that already have a scheme pass through. */
export function toFileUri(path: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(path) ? path : `file://${path}`;
}
