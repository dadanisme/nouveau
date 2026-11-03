import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library/legacy';
import * as Sharing from 'expo-sharing';

import { type Proof } from '@/hooks/use-proofs';
import i18n from '@/lib/i18n';
import { k } from '@/locales/keys';
import { cleanupTempDownloads, downloadToTempFile, isSaveableImage } from '@/utils/file';

export function useProofDownload() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const saveAllToPhotos = useCallback(async (proofs: Proof[]) => {
    const imageProofs = proofs.filter((p) => isSaveableImage(p.mimeType));
    if (imageProofs.length === 0) return;

    setIsSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(i18n.t(k.proofs.permissionDenied), i18n.t(k.proofs.permissionMessage));
        return;
      }

      for (const proof of imageProofs) {
        const file = await downloadToTempFile(proof.url, proof.filename);
        await MediaLibrary.saveToLibraryAsync(file.uri);
      }

      Alert.alert(
        i18n.t(k.proofs.saved),
        imageProofs.length === 1
          ? i18n.t(k.proofs.savedOne)
          : i18n.t(k.proofs.savedMany, { count: imageProofs.length }),
      );
    } catch {
      Alert.alert(i18n.t(k.proofs.saveFailed), i18n.t(k.proofs.saveFailedMessage));
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
      Alert.alert(i18n.t(k.proofs.shareFailed), i18n.t(k.proofs.shareFailedMessage));
    } finally {
      cleanupTempDownloads();
      setIsSharing(false);
    }
  }, []);

  return {
    isSaving,
    isSharing,
    saveAllToPhotos,
    share,
  };
}
