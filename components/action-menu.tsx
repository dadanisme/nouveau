import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';
import { colors, design } from '@/constants/colors';

interface ActionMenuItem {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

interface ActionMenuProps {
  visible: boolean;
  onDismiss: () => void;
  actions: ActionMenuItem[];
}

export function ActionMenu({ visible, onDismiss, actions }: ActionMenuProps) {
  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <BottomSheetView style={styles.container}>
        {actions.map((action, index) => (
          <Pressable
            key={action.label}
            style={[styles.item, index < actions.length - 1 && styles.itemBorder]}
            onPress={() => {
              onDismiss();
              action.onPress();
            }}
          >
            <Ionicons
              name={action.icon}
              size={20}
              color={action.destructive ? colors.expense : colors.gray[700]}
            />
            <Text style={[styles.label, action.destructive && { color: colors.expense }]}>
              {action.label}
            </Text>
          </Pressable>
        ))}
        <View style={styles.bottomPadding} />
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: design.spacing.lg,
    paddingTop: design.spacing.sm,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: design.spacing.md,
    paddingVertical: design.spacing.md,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  label: {
    fontSize: design.fontSize.md,
    fontWeight: '700',
    color: colors.gray[700],
  },
  bottomPadding: {
    height: design.spacing.lg,
  },
});
