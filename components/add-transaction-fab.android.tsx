import { FloatingActionButton, Host, Icon } from '@expo/ui/jetpack-compose';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';

// Material 3 metrics: a 56dp FAB, 16dp from the screen edges.
const FAB_SIZE = 56;
const FAB_MARGIN = 16;

/** Bottom space a scroll view needs so its last row can clear the FAB. */
export const ADD_FAB_CLEARANCE = FAB_SIZE + FAB_MARGIN * 2;

/**
 * Material 3 FAB that presents the add-transaction sheet. Its palette is seeded from the
 * accent, so the container is the accent's `primaryContainer` role in light and dark.
 */
export function AddTransactionFab() {
  const router = useRouter();
  const { t } = useLanguage();

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Host matchContents seedColor={ACCENT_COLOR}>
        <FloatingActionButton onClick={() => router.push('/add-transaction')}>
          <FloatingActionButton.Icon>
            <Icon
              source={require('@/assets/icons/add.xml')}
              contentDescription={t(k.addTransaction.addTransaction)}
            />
          </FloatingActionButton.Icon>
        </FloatingActionButton>
      </Host>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: FAB_MARGIN,
    bottom: FAB_MARGIN,
  },
});
