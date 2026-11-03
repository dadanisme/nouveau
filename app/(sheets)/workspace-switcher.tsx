import { FormListRow, FormSection, NativeForm } from '@/components/native-form';
import { useLanguage } from '@/contexts/language';
import { useWorkspaceSwitcherSheet } from '@/hooks/use-workspace-switcher-sheet';
import { k } from '@/locales/keys';

const ICONS = {
  personal: { sf: 'person', md: require('@/assets/icons/person.xml') },
  shared: { sf: 'person.2', md: require('@/assets/icons/group.xml') },
} as const;

/**
 * Workspace switcher sheet: a native single-choice list (checkmark on the active workspace).
 * Picking one makes it active and closes the sheet.
 */
export default function WorkspaceSwitcherSheet() {
  const { t } = useLanguage();
  const { workspaces } = useWorkspaceSwitcherSheet();

  return (
    <NativeForm title={t(k.workspace.switch)}>
      <FormSection>
        {workspaces.map((ws) => (
          <FormListRow
            key={ws.id}
            title={ws.name}
            subtitle={ws.subtitle}
            icon={ws.isPersonal ? ICONS.personal : ICONS.shared}
            selected={ws.isActive}
            onPress={ws.select}
          />
        ))}
      </FormSection>
    </NativeForm>
  );
}
