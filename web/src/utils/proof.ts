export type ProofKind = 'image' | 'pdf' | 'other';

/** How a proof is shown: images in a lightbox, PDFs and everything else in a new tab. */
export function proofKind(mimeType: string): ProofKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
}
