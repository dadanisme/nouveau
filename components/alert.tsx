import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, runOnJS, ZoomIn, ZoomOut } from 'react-native-reanimated';

import { colors, design } from '@/constants/colors';
import { Button } from '@/components/button';

interface AlertAction {
  label: string;
  variant?: 'primary' | 'outline' | 'dark';
  onPress?: () => void;
}

interface AlertProps {
  visible: boolean;
  title: string;
  message?: string;
  actions?: AlertAction[];
  onDismiss?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Alert({ visible, title, message, actions, onDismiss }: AlertProps) {
  const resolvedActions = actions ?? [{ label: 'OK', variant: 'primary', onPress: onDismiss }];

  // Keep Modal mounted while exit animation plays
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
            entering={ZoomIn.springify().damping(20).stiffness(200).mass(0.8)}
            exiting={ZoomOut.duration(100).withCallback((finished) => {
              'worklet';
              if (finished) {
                runOnJS(setModalVisible)(false);
              }
            })}
            style={[styles.container, design.shadow]}
          >
            <Pressable>
              <Text style={styles.title}>{title}</Text>
              {message ? <Text style={styles.message}>{message}</Text> : null}
              <View style={[styles.actions, resolvedActions.length === 1 && styles.actionsSingle]}>
                {resolvedActions.map((action) => (
                  <Button
                    key={action.label}
                    variant={action.variant ?? 'outline'}
                    style={resolvedActions.length === 1 ? styles.actionFull : styles.action}
                    onPress={action.onPress ?? onDismiss}
                  >
                    <Text
                      style={[
                        styles.actionLabel,
                        action.variant === 'dark' && styles.actionLabelLight,
                      ]}
                    >
                      {action.label}
                    </Text>
                  </Button>
                ))}
              </View>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: design.spacing.xl,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: design.radius.lg,
    borderWidth: design.borderWidth,
    borderColor: colors.black,
    padding: design.spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  title: {
    fontSize: design.fontSize.lg,
    fontWeight: '800',
    color: colors.black,
    marginBottom: design.spacing.xs,
  },
  message: {
    fontSize: design.fontSize.sm,
    color: colors.gray[600],
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: design.spacing.sm,
    marginTop: design.spacing.md,
  },
  actionsSingle: {
    justifyContent: 'flex-end',
  },
  action: {
    flex: 1,
    paddingVertical: design.spacing.sm,
  },
  actionFull: {
    paddingVertical: design.spacing.sm,
  },
  actionLabel: {
    fontSize: design.fontSize.sm,
    fontWeight: '700',
    color: colors.black,
  },
  actionLabelLight: {
    color: colors.white,
  },
});
