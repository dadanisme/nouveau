import { useState, useCallback } from 'react';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

import { type Proof } from '@/hooks/use-proofs';
import { cleanupTempDownloads, downloadToTempFile, isSaveableImage } from '@/utils/file';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
}

const initialAlert: AlertState = {
  visible: false,
  title: '',
  message: '',
};

export function useProofDownload() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [alert, setAlert] = useState<AlertState>(initialAlert);

  const saveAllToPhotos = useCallback(async (proofs: Proof[]) => {
    const imageProofs = proofs.filter((p) => isSaveableImage(p.mimeType));
    if (imageProofs.length === 0) return;

    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        setAlert({
          visible: true,
          title: 'Permission Denied',
          message: 'Please allow photo library access in Settings to save images.',
        });
        return;
      }

      for (const proof of imageProofs) {
        const file = await downloadToTempFile(proof.url, proof.filename);
        await MediaLibrary.saveToLibraryAsync(file.uri);
      }

      setAlert({
        visible: true,
        title: 'Saved',
        message:
          imageProofs.length === 1
            ? 'Image saved to your photo library.'
            : `${imageProofs.length} images saved to your photo library.`,
      });
    } catch {
      setAlert({
        visible: true,
        title: 'Save Failed',
        message: 'Could not save images. Please try again.',
      });
    } finally {
      cleanupTempDownloads();
      setIsSaving(false);
    }
  }, []);

  const share = useCallback(async (proofs: Proof[]) => {
    if (proofs.length === 0) return;

    setIsSharing(true);
    try {
      const proof = proofs[0];
      const file = await downloadToTempFile(proof.url, proof.filename);
      await Sharing.shareAsync(file.uri, { mimeType: proof.mimeType });
    } catch {
      setAlert({
        visible: true,
        title: 'Share Failed',
        message: 'Could not share the file. Please try again.',
      });
    } finally {
      cleanupTempDownloads();
      setIsSharing(false);
    }
  }, []);

  const dismissAlert = useCallback(() => {
    setAlert(initialAlert);
  }, []);

  return {
    isSaving,
    isSharing,
    saveAllToPhotos,
    share,
    alert,
    dismissAlert,
  };
}
