import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../state/gameStore';
import { getEventNews } from '../data/eventNews';
import { Card } from '../components/Card';
import { GridBackdrop } from '../components/GridBackdrop';
import { getNewsImage } from '../assets/images/registry';
import { colors, spacing, typography } from '../theme/theme';

export function NewsScreen() {
  const newsFeed = useGameStore((s) => s.state.history.newsFeed);
  const stores = useGameStore((s) => s.state.stores);
  const items = useMemo(() => [...newsFeed].reverse(), [newsFeed]);
  const storeNameById = useMemo(() => new Map(stores.map((store) => [store.id, store.name])), [stores]);

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <Text style={styles.emptyText}>まだニュースはありません。ターンを進めると経済ニュースが届きます。</Text>
      ) : (
        <FlatList
          contentContainerStyle={styles.content}
          data={items}
          keyExtractor={(item, index) => `${item.turn}-${item.eventId}-${index}`}
          renderItem={({ item }) => {
            const news = getEventNews(item.eventId);
            const storeName = item.storeId ? storeNameById.get(item.storeId) : undefined;
            const newsImage = getNewsImage(item.eventId);
            return (
              <Card style={styles.card}>
                <View style={styles.cardBody}>
                  <GridBackdrop image={newsImage} style={styles.thumb}>
                    <Ionicons name={news.icon} size={16} color={colors.roastLight} />
                  </GridBackdrop>
                  <View style={styles.textColumn}>
                    <View style={styles.row}>
                      <Text style={styles.turnLabel}>T{item.turn}</Text>
                      {storeName ? <Text style={styles.storeBadge}>{storeName}</Text> : null}
                    </View>
                    <Text style={styles.headline}>{news.headline}</Text>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  card: { gap: 4 },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  thumb: { height: 44, width: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  textColumn: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  turnLabel: { ...typography.label, color: colors.textMuted },
  storeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.roast,
    backgroundColor: colors.hudPill,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headline: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 24, padding: spacing.md },
});
