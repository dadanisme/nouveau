import { SecureField, TextField, type SecureFieldRef, type TextFieldRef } from '@expo/ui/swift-ui';
import {
  autocorrectionDisabled,
  disabled,
  keyboardType,
  onSubmit,
  submitLabel,
  textContentType,
  textInputAutocapitalization,
} from '@expo/ui/swift-ui/modifiers';
import { useImperativeHandle, useRef, type Ref } from 'react';

/**
 * What the field holds, which sets its keyboard, masking and autofill hint on each platform:
 *
 * | content         | iOS `textContentType` | Android autofill `ContentType` | keyboard / masking |
 * | --------------- | --------------------- | ------------------------------ | ------------------ |
 * | `email`         | `username`            | `Username`                     | email              |
 * | `newEmail`      | `username`            | `NewUsername`                  | email              |
 * | `password`      | `password`            | `Password`                     | masked             |
 * | `newPassword`   | `newPassword`         | `NewPassword`                  | masked             |
 *
 * The sign-in identifier is an email, but iOS pairs saved passwords and passkeys with the field
 * marked `username` (Apple's guidance for login forms), so it gets that hint plus an email keyboard.
 * `newPassword` makes iOS and Google offer a strong generated password.
 */
export type FormTextFieldContent = 'email' | 'newEmail' | 'password' | 'newPassword';

/** The keyboard's return key: `next` moves to the following field, the others submit. */
export type FormTextFieldReturnKey = 'next' | 'go' | 'join' | 'done';

export type FormTextFieldRowRef = { focus: () => void };

export type FormTextFieldRowProps = {
  ref?: Ref<FormTextFieldRowRef>;
  /** The placeholder (iOS) or floating label (Android). */
  label: string;
  content: FormTextFieldContent;
  returnKey: FormTextFieldReturnKey;
  onChangeText: (text: string) => void;
  /** The return key was pressed. */
  onSubmit: () => void;
  disabled?: boolean;
  /** Android only: the password visibility toggle's accessibility labels. */
  showPasswordLabel?: string;
  hidePasswordLabel?: string;
};

const IS_PASSWORD: Record<FormTextFieldContent, boolean> = {
  email: false,
  newEmail: false,
  password: true,
  newPassword: true,
};

const CONTENT_TYPE = {
  email: 'username',
  newEmail: 'username',
  password: 'password',
  newPassword: 'newPassword',
} as const;

/**
 * A SwiftUI `TextField` (or `SecureField` for passwords) as a grouped `Form` row, with the
 * autofill content type, keyboard and return key set. A focused field scrolls into view above
 * the keyboard natively.
 */
export function FormTextFieldRow({
  ref,
  label,
  content,
  returnKey,
  onChangeText,
  onSubmit: handleSubmit,
  disabled: isDisabled,
}: FormTextFieldRowProps) {
  const textField = useRef<TextFieldRef>(null);
  const secureField = useRef<SecureFieldRef>(null);
  useImperativeHandle(
    ref,
    () => ({ focus: () => void (textField.current ?? secureField.current)?.focus() }),
    [],
  );

  const common = [
    textContentType(CONTENT_TYPE[content]),
    textInputAutocapitalization('never'),
    autocorrectionDisabled(),
    submitLabel(returnKey),
    onSubmit(handleSubmit),
    disabled(Boolean(isDisabled)),
  ];

  if (IS_PASSWORD[content]) {
    return (
      <SecureField
        ref={secureField}
        placeholder={label}
        onTextChange={onChangeText}
        modifiers={common}
      />
    );
  }

  return (
    <TextField
      ref={textField}
      placeholder={label}
      onTextChange={onChangeText}
      modifiers={[...common, keyboardType('email-address')]}
    />
  );
}
