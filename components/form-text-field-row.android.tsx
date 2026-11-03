import {
  Icon,
  IconButton,
  OutlinedTextField,
  Text,
  type TextFieldImeAction,
  type TextFieldRef,
} from '@expo/ui/jetpack-compose';
import { fillMaxWidth, semantics } from '@expo/ui/jetpack-compose/modifiers';
import { useImperativeHandle, useRef, useState } from 'react';

import type {
  FormTextFieldContent,
  FormTextFieldReturnKey,
  FormTextFieldRowProps,
} from '@/components/form-text-field-row';

const IS_PASSWORD: Record<FormTextFieldContent, boolean> = {
  email: false,
  newEmail: false,
  password: true,
  newPassword: true,
};

// Compose autofill hints (`ContentType`), as named by the expo-ui `semantics` modifier.
const AUTOFILL_HINT: Record<FormTextFieldContent, string> = {
  email: 'username',
  newEmail: 'username-new',
  password: 'current-password',
  newPassword: 'new-password',
};

// Android IME actions have no "join"; "done" submits the form.
const IME_ACTION: Record<FormTextFieldReturnKey, TextFieldImeAction> = {
  next: 'next',
  go: 'go',
  join: 'done',
  done: 'done',
};

/**
 * A Material 3 outlined text field, full width, with its autofill hint, keyboard and IME action
 * set. Passwords are masked, with the M3 trailing visibility toggle.
 */
export function FormTextFieldRow({
  ref,
  label,
  content,
  returnKey,
  onChangeText,
  onSubmit,
  disabled,
  showPasswordLabel,
  hidePasswordLabel,
}: FormTextFieldRowProps) {
  const field = useRef<TextFieldRef>(null);
  useImperativeHandle(ref, () => ({ focus: () => void field.current?.focus() }), []);

  const isPassword = IS_PASSWORD[content];
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <OutlinedTextField
      ref={field}
      singleLine
      enabled={!disabled}
      onValueChange={onChangeText}
      visualTransformation={isPassword && !isRevealed ? 'password' : 'none'}
      keyboardOptions={{
        keyboardType: isPassword ? 'password' : 'email',
        capitalization: 'none',
        autoCorrectEnabled: false,
        imeAction: IME_ACTION[returnKey],
      }}
      keyboardActions={{ onNext: onSubmit, onGo: onSubmit, onDone: onSubmit }}
      modifiers={[fillMaxWidth(), semantics({ contentType: AUTOFILL_HINT[content] })]}
    >
      <OutlinedTextField.Label>
        <Text>{label}</Text>
      </OutlinedTextField.Label>
      {isPassword ? (
        <OutlinedTextField.TrailingIcon>
          <IconButton onClick={() => setIsRevealed((revealed) => !revealed)}>
            <Icon
              source={
                isRevealed
                  ? require('@/assets/icons/visibility_off.xml')
                  : require('@/assets/icons/visibility.xml')
              }
              contentDescription={isRevealed ? hidePasswordLabel : showPasswordLabel}
            />
          </IconButton>
        </OutlinedTextField.TrailingIcon>
      ) : null}
    </OutlinedTextField>
  );
}
