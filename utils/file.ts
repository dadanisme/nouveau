import { File } from 'expo-file-system';

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
