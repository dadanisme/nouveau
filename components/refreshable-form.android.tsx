import {
  Host,
  LazyColumn,
  PullToRefreshBox,
  useMaterialColors,
  type MaterialColors,
} from '@expo/ui/jetpack-compose';
import { background, fillMaxSize } from '@expo/ui/jetpack-compose/modifiers';
import { StyleSheet } from 'react-native';

import type { RefreshableFormProps } from '@/components/form-extras-types';
import { ACCENT_COLOR } from '@/constants/accent';

// Same palette as `NativeForm`: the system (dynamic) colors, with the accent only as `primary`.
const COLOR_OVERRIDES: Partial<MaterialColors> = { primary: ACCENT_COLOR as `#${string}` };

/**
 * `NativeForm` with pull-to-refresh: a Material 3 `PullToRefreshBox` around the `LazyColumn` of
 * list items. Render it as the screen's root, under the native Stack header.
 */
export function RefreshableForm({ onRefresh, isRefreshing, children }: RefreshableFormProps) {
  return (
    <Host style={styles.fill} colorOverrides={COLOR_OVERRIDES}>
      <RefreshableSurface onRefresh={onRefresh} isRefreshing={isRefreshing}>
        {children}
      </RefreshableSurface>
    </Host>
  );
}

function RefreshableSurface({ onRefresh, isRefreshing, children }: RefreshableFormProps) {
  const colors = useMaterialColors();
  return (
    <PullToRefreshBox
      isRefreshing={isRefreshing}
      onRefresh={() => void onRefresh()}
      modifiers={[fillMaxSize()]}
    >
      <LazyColumn
        contentPadding={{ bottom: 24 }}
        modifiers={[fillMaxSize(), background(colors.surface)]}
      >
        {children}
      </LazyColumn>
    </PullToRefreshBox>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
