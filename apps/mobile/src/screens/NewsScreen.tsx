import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../state/gameStore';
import { getEventNews } from '../data/eventNews';
import { Card } from '../components/Card';
import { colors, spacing, typography } from '../theme/theme';

export function NewsScreen() {
  const newsFeed = useGameStore((s) => s.state.history.newsFeed);
  const items = useMemo(() => [...newsFeed].reverse(), [newsFeed]);

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
            return (
              <Card style={styles.card}>
                <View style={styles.row}>
                  <Ionicons name={news.icon} size={16} color={colors.roastLight} />
                  <Text style={styles.turnLabel}>T{item.turn}</Text>
                </View>
                <Text style={styles.headline}>{news.headline}</Text>
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
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  turnLabel: { ...typography.label, color: colors.textMuted },
  headline: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginTop: 24, padding: spacing.md },
});
