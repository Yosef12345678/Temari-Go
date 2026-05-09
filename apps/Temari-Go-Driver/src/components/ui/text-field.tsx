import React from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  helperText?: string;
  error?: string | null;
  rightAccessory?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({ label, helperText, error, rightAccessory, containerStyle, style, ...props }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrap}>
      {label ? <ThemedText type="smallBold">{label}</ThemedText> : null}
      <View style={[
        styles.inputWrap,
        { borderColor: error ? theme.destructive : theme.border, backgroundColor: theme.background },
        containerStyle,
      ]}>
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }, style]}
          {...props}
        />
        {rightAccessory ? <View style={styles.accessory}>{rightAccessory}</View> : null}
      </View>
      {error ? <ThemedText type="small" style={{ color: theme.destructive }}>{error}</ThemedText> : null}
      {!error && helperText ? <ThemedText type="small" themeColor="textSecondary">{helperText}</ThemedText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 15,
    lineHeight: 20,
  },
  accessory: {
    marginLeft: 8,
  },
});
