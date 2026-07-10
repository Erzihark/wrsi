import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

/**
 * Refetch a TanStack Query whenever the screen regains focus.
 *
 * Why this is needed: our admin sections are native stacks (List → Detail). When
 * you push the create/edit Detail screen, react-navigation keeps the List screen
 * *mounted* underneath (react-native-screens freezes it), so returning via
 * `goBack()` never remounts it — `refetchOnMount` never fires, and a background
 * `invalidateQueries` on a frozen screen isn't reliably reflected. The result was
 * a newly-created row not appearing in the list until a full JS reload.
 *
 * Screen focus is a navigation event independent of mount/freeze, so refetching
 * on focus guarantees the list reflects any create/edit/delete done on a child
 * screen. The initial focus is skipped so we don't double-fetch on first mount
 * (the query already fetches then); every subsequent focus (i.e. returning to the
 * list) refetches.
 */
export function useRefetchOnFocus(refetch: () => unknown): void {
  const isFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isFirstFocus.current) {
        isFirstFocus.current = false;
        return;
      }
      refetch();
    }, [refetch]),
  );
}
