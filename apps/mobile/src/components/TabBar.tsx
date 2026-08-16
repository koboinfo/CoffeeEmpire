import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/theme';

export interface TabBarItem<T extends string> {
  key: T;
  label: string;
}

interface TabBarProps<T extends string> {
  items: TabBarItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
}

export function TabBar<T extends string>({ items, activeKey, onChange }: TabBarProps<T>) {
  return (
    <View style={styles.container}>
      {items.map((item) => {
        const isActive = item.key === activeKey;
        return (
          <Pressable
            key={item.key}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChange(item.key)}
          >
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  tabActive: { backgroundColor: colors.roast },
  tabLabel: { ...typography.label, fontSize: 13, color: colors.textSecondary },
  tabLabelActive: { color: colors.white, fontWeight: '700' },
});
