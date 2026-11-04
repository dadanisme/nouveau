import { Form, HStack, Host, Image, Picker, Text, VStack } from '@expo/ui/swift-ui';
import { background, font, labelsHidden, pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import { PlatformColor, StyleSheet } from 'react-native';

import { ACCENT_COLOR } from '@/constants/accent';
import { useLanguage } from '@/contexts/language';
import { k } from '@/locales/keys';
import {
  systemColorValue,
  type CategorySystemColor,
  type CategorySystemColorId,
} from '@/utils/category-color';

interface ColorPickerListProps {
  colors: readonly CategorySystemColor[];
  selectedId: CategorySystemColorId | null;
  onSelect: (id: CategorySystemColorId) => void;
}

/**
 * The color picker sheet body on iOS: an inline SwiftUI `Picker` in a `Form`, one row per system
 * color (a filled circle in that color and its name), with the system checkmark on the selection.
 */
export function ColorPickerList({ colors, selectedId, onSelect }: ColorPickerListProps) {
  const { t } = useLanguage();

  return (
    <Host style={styles.host} seedColor={ACCENT_COLOR}>
      <VStack
        spacing={0}
        modifiers={[
          background(PlatformColor('systemGroupedBackground'), { ignoresSafeAreaEdges: 'all' }),
        ]}
      >
        <Form>
          <Picker<CategorySystemColorId | null>
            label={t(k.categories.color)}
            selection={selectedId}
            onSelectionChange={(id) => {
              if (id) onSelect(id);
            }}
            modifiers={[pickerStyle('inline'), labelsHidden()]}
          >
            {colors.map((color) => (
              <HStack key={color.id} spacing={12} modifiers={[tag(color.id)]}>
                <Image
                  systemName="circle.fill"
                  color={systemColorValue(color)}
                  modifiers={[font({ textStyle: 'title2' })]}
                />
                <Text>{t(color.labelKey)}</Text>
              </HStack>
            ))}
          </Picker>
        </Form>
      </VStack>
    </Host>
  );
}

const styles = StyleSheet.create({
  host: {
    flex: 1,
  },
});
