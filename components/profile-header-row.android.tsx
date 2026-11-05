import { Icon, Image, ListItem, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { clickable, clip, Shapes, size } from '@expo/ui/jetpack-compose/modifiers';

import type { ProfileHeaderRowProps } from '@/components/profile-header-row';

// Material 3 list item large leading avatar.
const AVATAR_SIZE = 56;

/**
 * The profile header row: avatar, name and email. With `onPress` the whole list item is clickable
 * (TalkBack reads the name and email and announces it as actionable); Material lists show no
 * chevron. `accessibilityHint` is iOS-only: Compose has no hint, the row's text names it.
 */
export function ProfileHeaderRow({ name, email, imageUri, onPress }: ProfileHeaderRowProps) {
  const colors = useMaterialColors();

  return (
    <ListItem modifiers={onPress ? [clickable(onPress)] : undefined}>
      <ListItem.LeadingContent>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            contentScale="crop"
            contentDescription={null}
            modifiers={[size(AVATAR_SIZE, AVATAR_SIZE), clip(Shapes.Circle)]}
          />
        ) : (
          <Icon
            source={require('@/assets/icons/account_circle.xml')}
            size={AVATAR_SIZE}
            tint={colors.onSurfaceVariant}
          />
        )}
      </ListItem.LeadingContent>
      <ListItem.HeadlineContent>
        <Text style={{ typography: 'titleLarge' }}>{name}</Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Text>{email}</Text>
      </ListItem.SupportingContent>
    </ListItem>
  );
}
