import React from 'react';
import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

type FilterChipProps = PressableProps & {
  label: string;
  selected?: boolean;
};

export function FilterChip({ label, selected = false, style, ...props }: FilterChipProps) {
  const theme = useTheme();
  const baseStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      backgroundColor: selected ? theme.tint : theme.background,
      borderColor: selected ? theme.tint : theme.border,
    },
  ];

  return (
    <Pressable
      style={typeof style === 'function' ? (state) => [baseStyle, style(state)] : [baseStyle, style]}
      {...props}
    >
      <ThemedText type="defaultSemiBold" style={{ color: selected ? '#ffffff' : theme.text, fontSize: 13 }}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
