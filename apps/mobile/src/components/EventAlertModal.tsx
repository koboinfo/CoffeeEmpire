import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../state/gameStore';
import { getEventNews } from '../data/eventNews';
import { AppModal } from './Modal';
import { AppButton } from './AppButton';
import { FireIcon, TrendingIcon, StarIcon, WarningIcon } from '../icons';
import { colors } from '../theme/theme';

const ICON_BY_KEY: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  'trending-up': TrendingIcon,
  'trending-down': TrendingIcon,
  'alert-circle': WarningIcon,
  flame: FireIcon,
  star: StarIcon,
};

const CASH_NEGATIVE_TONE: Record<string, string> = {
  'alert-circle': colors.negative,
  flame: colors.negative,
};

export function EventAlertModal() {
  const triggeredEvents = useGameStore((s) => s.latestTriggeredEvents);
  const triggeredStoreEvents = useGameStore((s) => s.latestTriggeredStoreEvents);
  const stores = useGameStore((s) => s.state.stores);
  const dismissTriggeredEvents = useGameStore((s) => s.dismissTriggeredEvents);

  const storeNameById = useMemo(() => new Map(stores.map((store) => [store.id, store.name])), [stores]);

  const rows = useMemo(() => {
    const companyRows = triggeredEvents.map((event) => ({
      key: `company-${event.id}`,
      news: getEventNews(event.id),
      storeName: undefined as string | undefined,
      cashAmount: undefined as number | undefined,
    }));
    const storeRows = triggeredStoreEvents.map((event) => ({
      key: `store-${event.storeId}-${event.eventId}`,
      news: getEventNews(event.eventId),
      storeName: storeNameById.get(event.storeId),
      cashAmount: event.cashAmount,
    }));
    return [...companyRows, ...storeRows];
  }, [triggeredEvents, triggeredStoreEvents, storeNameById]);

  const visible = rows.length > 0;
  const hasUrgent = rows.some((row) => row.news.icon === 'alert-circle' || row.news.icon === 'flame');

  return (
    <AppModal
      visible={visible}
      onClose={dismissTriggeredEvents}
      title={hasUrgent ? '緊急連絡' : '本日のニュース'}
      tone={hasUrgent ? 'urgent' : 'default'}
      footer={<AppButton label="確認した" icon="checkmark-circle" onPress={dismissTriggeredEvents} />}
    >
      {rows.map((row) => {
        const Icon = ICON_BY_KEY[row.news.icon] ?? WarningIcon;
        const tone = CASH_NEGATIVE_TONE[row.news.icon] ?? colors.textPrimary;
        return (
          <View
            key={row.key}
            className="flex-row items-start gap-sm rounded-sm p-sm"
            style={{ backgroundColor: tone === colors.negative ? 'rgba(226,86,75,0.14)' : 'rgba(255,255,255,0.04)' }}
          >
            <View
              className="mt-[2px] h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: `${tone}26` }}
            >
              <Icon size={16} color={tone} />
            </View>
            <View className="flex-1 gap-[2px]">
              {row.storeName ? <Text className="text-[11px] font-bold text-roast">{row.storeName}</Text> : null}
              <Text className="text-sm font-semibold text-text-primary">{row.news.headline}</Text>
              {typeof row.cashAmount === 'number' && row.cashAmount !== 0 ? (
                <Text className="text-xs font-bold" style={{ color: row.cashAmount < 0 ? colors.negative : colors.positive }}>
                  {row.cashAmount < 0 ? '' : '+'}
                  {Math.round(row.cashAmount).toLocaleString('ja-JP')}円
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </AppModal>
  );
}
