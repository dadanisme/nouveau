import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { colors, design } from '@/constants/colors';
import type { Tables } from '@/types/supabase';
import { scheduleOnRN } from 'react-native-worklets';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CategoryPickerProps {
  visible: boolean;
  categories: Tables<'categories'>[];
  selectedCategoryId: string | null;
  onSelect: (category: Tables<'categories'>) => void;
  onDismiss: () => void;
}

export function CategoryPicker({
  visible,
  categories,
  selectedCategoryId,
  onSelect,
  onDismiss,
}: CategoryPickerProps) {
  const [modalVisible, setModalVisible] = useState(visible);
  const [contentVisible, setContentVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      setContentVisible(true);
    } else {
      setContentVisible(false);
    }
  }, [visible]);

  return (
    <Modal visible={modalVisible} transparent animationType="none" onRequestClose={onDismiss}>
      {contentVisible ? (
        <AnimatedPressable
          entering={FadeIn.duration(120)}
          exiting={FadeOut.duration(100)}
          style={styles.overlay}
          onPress={onDismiss}
        >
          <Animated.View
            entering={SlideInDown.springify().damping(20).stiffness(200).mass(0.8)}
            exiting={SlideOutDown.duration(200).withCallback((finished) => {
              'worklet';
              if (finished) {
                scheduleOnRN(setModalVisible, false);
              }
            })}
            style={styles.sheet}
          >
            <Pressable>
              <View style={styles.handle} />
              <Text style={styles.title}>Select Category</Text>
              <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                {categories.map((category) => {
                  const isSelected = category.id === selectedCategoryId;
                  return (
                    <Pressable
                      key={category.id}
                      style={[styles.row, isSelected && styles.rowSelected]}
                      onPress={() => onSelect(category)}
                    >
                      <View style={[styles.dot, { backgroundColor: category.color }]} />
                      <Text style={[styles.rowText, isSelected && styles.rowTextSelected]}>
                        {category.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark" size={20} color={colors.black} />}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Animated.View>
        </AnimatedPressable>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: design.radius.xl,
    borderTopRightRadius: design.radius.xl,
    borderWidth: design.borderWidth,
    borderBottomWidth: 0,
    borderColor: colors.black,
    paddingHorizontal: design.spacing.lg,
    paddingBottom: design.spacing.xl,
    maxHeight: '60%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: design.spacing.sm,
    marginBottom: design.spacing.md,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    marginBottom: design.spacing.md,
  },
  list: {
    maxHeight: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: design.spacing.md,
    paddingHorizontal: design.spacing.sm,
    borderRadius: design.radius.sm,
    gap: design.spacing.sm,
  },
  rowSelected: {
    backgroundColor: colors.primary.light,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  rowText: {
    flex: 1,
    fontSize: design.fontSize.md,
    fontWeight: '600',
    color: colors.gray[700],
  },
  rowTextSelected: {
    color: colors.black,
    fontWeight: '800',
  },
});
