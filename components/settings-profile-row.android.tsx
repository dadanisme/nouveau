import { Icon, Image, ListItem, Text, useMaterialColors } from '@expo/ui/jetpack-compose';
import { clip, Shapes, size } from '@expo/ui/jetpack-compose/modifiers';

import type { SettingsProfileRowProps } from '@/components/settings-profile-row';

// Material 3 list item large leading avatar.
const AVATAR_SIZE = 56;

/** The profile header row of the Settings list: avatar, name and email. Not interactive. */
export function SettingsProfileRow({ name, email, imageUri }: SettingsProfileRowProps) {
  const colors = useMaterialColors();

  return (
    <ListItem>
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
