import React from 'react';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = PressableProps & {
  label: string;
  variant?: 'default' | 'outline' | 'destructive';
};

export function Button({ label, variant = 'default', style, ...props }: ButtonProps) {
  const theme = useTheme();
  const backgroundColor =
    variant === 'destructive' ? theme.destructive : variant === 'outline' ? theme.background : theme.tint;
  const borderColor = variant === 'outline' ? theme.border : backgroundColor;
  const textColor = variant === 'outline' ? theme.text : '#ffffff';

  return (
    <Pressable style={[styles.base, { backgroundColor, borderColor }, style]} {...props}>
      <ThemedText style={[styles.text, { color: textColor }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    lineHeight: 20,
  },
});
