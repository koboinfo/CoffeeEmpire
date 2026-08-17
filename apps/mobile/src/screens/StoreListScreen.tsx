import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { cities } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { AppButton } from '../components/AppButton';
import { StoreCard } from '../components/StoreCard';
import { colors, spacing, typography } from '../theme/theme';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function StoreListScreen() {
  const navigation = useNavigation<Navigation>();
  const stores = useGameStore((store) => store.state.stores);
  const properties = useGameStore((store) => store.properties);

  const cityNameByPropertyId = useMemo(() => {
    const cityById = new Map(cities.map((city) => [city.id, city.name]));
    return new Map(properties.map((property) => [property.id, cityById.get(property.cityId)]));
  }, [properties]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>店舗</Text>
      <FlatList
        contentContainerStyle={styles.content}
        data={stores}
        keyExtractor={(store) => store.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>まだ店舗がありません。「新規出店」から始めましょう。</Text>
          </View>
        }
        renderItem={({ item: store }) => (
          <View style={styles.cardSlot}>
            <StoreCard
              store={store}
              cityName={cityNameByPropertyId.get(store.propertyId)}
              onPress={() => navigation.navigate('StoreDetail', { storeId: store.id })}
            />
          </View>
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
  row: { gap: spacing.sm },
  cardSlot: { flex: 1 },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xl },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  footer: { padding: spacing.md },
});
