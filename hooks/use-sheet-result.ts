import { useLocalSearchParams } from 'expo-router';
import { useEffect, useEffectEvent, useRef, useState } from 'react';

import { goBackOrHome } from '@/lib/navigation';
import {
  createSheetRequestId,
  emitSheetResult,
  subscribeSheetResult,
  type SheetKey,
  type SheetResultPayloads,
} from '@/lib/sheet-result';

/**
 * Listens for the result of a sheet route this screen presents.
 *
 * Returns a stable `requestId` to pass to the sheet as a route param; only results emitted with
 * that id reach `onResult`, so two presenters of the same sheet never see each other's results.
 * `onResult` always sees the latest render's state and props.
 */
export function useSheetResult<K extends SheetKey>(
  key: K,
  onResult: (payload: SheetResultPayloads[K]) => void,
): string {
  const [requestId] = useState(createSheetRequestId);
  const handleResult = useEffectEvent(onResult);

  useEffect(
    () =>
      subscribeSheetResult(key, (result) => {
        if (result.requestId === requestId) handleResult(result.payload);
      }),
    [key, requestId],
  );

  return requestId;
}

/**
 * For a sheet route: returns `respond(payload)`, which emits the result to the presenter that
 * passed the `requestId` param and closes the sheet. Only the first call counts, so a double tap
 * can't pop the screen underneath.
 */
export function useSheetResponder<K extends SheetKey>(
  key: K,
): (payload: SheetResultPayloads[K]) => void {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const respondedRef = useRef(false);

  return (payload) => {
    if (respondedRef.current) return;
    respondedRef.current = true;
    if (requestId) emitSheetResult(key, requestId, payload);
    goBackOrHome();
  };
}
