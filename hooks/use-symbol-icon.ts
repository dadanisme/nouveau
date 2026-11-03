import { useQuery } from '@tanstack/react-query';
import {
  unstable_getMaterialSymbolSourceAsync,
  type AndroidSymbol,
  type SymbolViewProps,
} from 'expo-symbols';
import { Platform, type ImageSourcePropType } from 'react-native';

type SFSymbol = Extract<SymbolViewProps['name'], string>;

// Header toolbar icons render at 24dp; the image is used as a template (tinted by the toolbar),
// so its own color is irrelevant and only acts as the mask.
const MATERIAL_ICON_SIZE = 24;
const MATERIAL_MASK_COLOR = '#000000';

/**
 * Icon for `Stack.Toolbar` items (`icon` prop): the SF Symbol name on iOS, and on Android the
 * Material Symbol rendered to an image source (Android toolbar menus drop SF Symbol names).
 * Undefined on Android until the image is ready.
 */
export function useSymbolIcon({
  sf,
  md,
}: {
  sf: SFSymbol;
  md: AndroidSymbol;
}): SFSymbol | ImageSourcePropType | undefined {
  const { data } = useQuery({
    queryKey: ['material-symbol-source', md, MATERIAL_ICON_SIZE],
    queryFn: () =>
      unstable_getMaterialSymbolSourceAsync(md, MATERIAL_ICON_SIZE, MATERIAL_MASK_COLOR),
    enabled: Platform.OS === 'android',
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (Platform.OS === 'ios') return sf;
  return data ?? undefined;
}
