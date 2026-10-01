import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import type { Proof } from '@/hooks/use-proofs';
import { en } from '@/locales/en';
import { saveBlob } from '@/utils/dom';

/**
 * Saves a proof to disk under its filename. The file is fetched first because the `download`
 * attribute is ignored for cross-origin URLs; if the storage host refuses the fetch, the proof
 * opens in a new tab instead so it can still be saved from there.
 */
export function useProofDownload() {
  const download = useMutation({
    mutationFn: async (proof: Proof) => {
      try {
        const response = await fetch(proof.url);
        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        saveBlob(await response.blob(), proof.filename);
      } catch {
        if (!window.open(proof.url, '_blank', 'noopener')) {
          throw new Error(en.panel.proofs.downloadFailed);
        }
      }
    },
    onError: () => toast.error(en.panel.proofs.downloadFailed),
  });

  return {
    download: download.mutate,
    downloadingId: download.isPending ? (download.variables?.id ?? null) : null,
  };
}
