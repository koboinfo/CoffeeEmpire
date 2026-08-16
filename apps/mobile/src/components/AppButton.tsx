import React from 'react';
import { Pressable, Text, StyleSheet, PressableProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme/theme';

interface AppButtonProps extends PressableProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function AppButton({ label, icon, variant = 'primary', disabled, style, ...props }: AppButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      disabled={disabled}
      style={[
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style as object,
      ]}
      {...props}
    >
      {icon ? (
        <Ionicons name={icon} size={18} color={isPrimary ? colors.white : colors.roastLight} style={styles.icon} />
      ) : null}
      <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.roast, borderWidth: 2, borderColor: colors.roastDark },
  secondary: { backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.45 },
  icon: { marginRight: spacing.xs },
  label: typography.button,
  primaryLabel: { color: colors.white },
  secondaryLabel: { color: colors.textPrimary },
});
