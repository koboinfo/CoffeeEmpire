import React from 'react';
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { Card } from '../components/Card';
import { AppButton } from '../components/AppButton';
import { colors, spacing, typography, radius } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function StoreListScreen() {
  const navigation = useNavigation<Navigation>();
  const stores = useGameStore((store) => store.state.stores);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>店舗</Text>
      <FlatList
        contentContainerStyle={styles.content}
        data={stores}
        keyExtractor={(store) => store.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>まだ店舗がありません。「新規出店」から始めましょう。</Text>
          </View>
        }
        renderItem={({ item: store }) => (
          <Pressable onPress={() => navigation.navigate('StoreDetail', { storeId: store.id })}>
            <Card style={styles.storeCard}>
              <View style={styles.storeIcon}>
                <Ionicons name="cafe" size={22} color={colors.roast} />
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeMeta}>メニュー {store.menu.length}品 ・ 従業員 {store.employeeIds.length}名</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Card>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <AppButton label="新規出店" icon="add-circle" onPress={() => navigation.navigate('NewStore', undefined)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { ...typography.title, color: colors.textPrimary, padding: spacing.md, paddingBottom: 0 },
  content: { padding: spacing.md, gap: spacing.sm },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  storeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  storeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: { flex: 1, gap: 2 },
  storeName: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  storeMeta: { fontSize: 13, color: colors.textSecondary },
  footer: { padding: spacing.md },
});
