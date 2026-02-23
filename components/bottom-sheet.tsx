import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';

import { colors, design } from '@/constants/colors';

interface BottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  children: React.ReactNode;
  snapPoints?: (string | number)[];
}

export function BottomSheet({ visible, onDismiss, children, snapPoints }: BottomSheetProps) {
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      onDismiss={onDismiss}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.background}
      handleIndicatorStyle={styles.handleIndicator}
      style={styles.sheet}
    >
      {children}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: design.radius.xl,
    borderTopRightRadius: design.radius.xl,
    borderWidth: design.borderWidth,
    borderBottomWidth: 0,
    borderColor: colors.black,
  },
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: design.radius.xl,
    borderTopRightRadius: design.radius.xl,
  },
  handleIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: 2,
  },
});
