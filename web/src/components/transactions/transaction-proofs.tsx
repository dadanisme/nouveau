import {
  DownloadIcon,
  ExternalLinkIcon,
  FileTextIcon,
  ImageOffIcon,
  LoaderCircleIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useProofDownload } from '@/hooks/use-proof-download';
import { type Proof, useProofs } from '@/hooks/use-proofs';
import { en } from '@/locales/en';
import { proofKind } from '@/utils/proof';
import { interpolate } from '@/utils/string';

const t = en.panel.proofs;

interface ProofTileProps {
  proof: Proof;
  isDownloading: boolean;
  onView: () => void;
  onDownload: () => void;
}

function ProofTile({ proof, isDownloading, onView, onDownload }: ProofTileProps) {
  const [hasFailed, setHasFailed] = useState(false);
  const kind = proofKind(proof.mimeType);
  const preview = 'flex aspect-4/3 w-full items-center justify-center bg-muted outline-none';

  return (
    <li className="overflow-hidden rounded-md border bg-card">
      {kind === 'image' && !hasFailed ? (
        <button
          type="button"
          aria-label={interpolate(t.view, { name: proof.filename })}
          onClick={onView}
          className={`${preview} cursor-zoom-in focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`}
        >
          <img
            src={proof.url}
            alt={proof.filename}
            loading="lazy"
            className="size-full object-cover"
            onError={() => setHasFailed(true)}
          />
        </button>
      ) : (
        // PDFs and other files open in the browser's own viewer.
        <a
          href={proof.url}
          target="_blank"
          rel="noreferrer"
          aria-label={interpolate(t.view, { name: proof.filename })}
          className={`${preview} flex-col gap-1 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset`}
        >
          {kind === 'image' ? (
            <ImageOffIcon className="size-6" />
          ) : (
            <FileTextIcon className="size-6" />
          )}
          <span className="text-xs">
            {kind === 'image'
              ? t.previewFailed
              : kind === 'pdf'
                ? 'PDF'
                : proof.mimeType || t.openInNewTab}
          </span>
        </a>
      )}
      <div className="flex items-center gap-1 border-t py-0.5 pr-0.5 pl-2">
        <span className="min-w-0 flex-1 truncate text-xs" title={proof.filename}>
          {proof.filename}
        </span>
        <Button variant="ghost" size="icon-xs" asChild>
          <a
            href={proof.url}
            target="_blank"
            rel="noreferrer"
            aria-label={t.openInNewTab}
            title={t.openInNewTab}
          >
            <ExternalLinkIcon />
          </a>
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t.download}
          title={t.download}
          disabled={isDownloading}
          onClick={onDownload}
        >
          {isDownloading ? <LoaderCircleIcon className="animate-spin" /> : <DownloadIcon />}
        </Button>
      </div>
    </li>
  );
}

interface ProofLightboxProps {
  proof: Proof | null;
  onDownload: (proof: Proof) => void;
  onClose: () => void;
}

function ProofLightbox({ proof, onDownload, onClose }: ProofLightboxProps) {
  return (
    <Dialog
      open={proof !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {proof && (
        <DialogContent aria-describedby={undefined} className="w-auto max-w-[90vw] gap-2 p-2">
          <div className="flex items-center gap-1 pl-2">
            <DialogTitle className="min-w-0 flex-1 truncate">{proof.filename}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => onDownload(proof)}>
              <DownloadIcon />
              {t.download}
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t.close} title={t.close}>
                <XIcon />
              </Button>
            </DialogClose>
          </div>
          <img
            src={proof.url}
            alt={proof.filename}
            className="max-h-[80vh] max-w-full min-w-64 rounded-md object-contain"
          />
        </DialogContent>
      )}
    </Dialog>
  );
}

/** Receipt proofs of one transaction: view and download only (attaching stays on mobile). */
export function TransactionProofs({ transactionId }: { transactionId: string }) {
  const { data: proofs, isPending, error, refetch } = useProofs(transactionId);
  const { download, downloadingId } = useProofDownload();
  const [viewing, setViewing] = useState<Proof | null>(null);

  return (
    <section aria-label={t.title} className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 pl-2 text-xs font-medium text-muted-foreground">
        {t.title}
        {proofs && proofs.length > 0 && <span className="tabular-nums">{proofs.length}</span>}
      </h3>

      {error ? (
        <div className="flex flex-col items-start gap-2 rounded-md border border-dashed p-3">
          <p>{t.loadFailed}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : isPending ? (
        <div aria-hidden className="grid grid-cols-2 gap-2">
          <Skeleton className="aspect-4/3" />
          <Skeleton className="aspect-4/3" />
        </div>
      ) : proofs.length === 0 ? (
        <div className="rounded-md border border-dashed p-3">
          <p>{t.empty}</p>
          <p className="text-xs text-muted-foreground">{t.emptyHint}</p>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {proofs.map((proof) => (
            <ProofTile
              key={proof.id}
              proof={proof}
              isDownloading={downloadingId === proof.id}
              onView={() => setViewing(proof)}
              onDownload={() => download(proof)}
            />
          ))}
        </ul>
      )}

      <ProofLightbox proof={viewing} onDownload={download} onClose={() => setViewing(null)} />
    </section>
  );
}
