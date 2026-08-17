import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../state/gameStore';
import { AppModal } from './Modal';
import { AppButton } from './AppButton';
import { StarIcon } from '../icons';
import { colors } from '../theme/theme';

function formatCurrency(amount: number): string {
  return `¥${Math.round(amount).toLocaleString('ja-JP')}`;
}

/** 経営マイルストーン(実績)を新規解除した際の通知。決算/イベント通知と同じAppModalベースのUI言語。 */
export function AchievementToast() {
  const unlockedAchievements = useGameStore((s) => s.latestUnlockedAchievements);
  const dismissUnlockedAchievements = useGameStore((s) => s.dismissUnlockedAchievements);

  const visible = unlockedAchievements.length > 0;

  return (
    <AppModal
      visible={visible}
      onClose={dismissUnlockedAchievements}
      title="実績を解除しました"
      footer={<AppButton label="確認した" icon="checkmark-circle" onPress={dismissUnlockedAchievements} />}
    >
      {unlockedAchievements.map((achievement) => (
        <View
          key={achievement.id}
          className="flex-row items-start gap-sm rounded-sm p-sm"
          style={{ backgroundColor: 'rgba(232,162,61,0.14)' }}
        >
          <View className="mt-[2px] h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(232,162,61,0.26)' }}>
            <StarIcon size={16} color={colors.gold} />
          </View>
          <View className="flex-1 gap-[2px]">
            <Text className="text-sm font-bold text-text-primary">{achievement.label}</Text>
            <Text className="text-xs text-text-secondary">{achievement.description}</Text>
            <Text className="text-xs font-bold" style={{ color: colors.positive }}>
              報酬 +{formatCurrency(achievement.rewardCash)}
            </Text>
          </View>
        </View>
      ))}
    </AppModal>
  );
}
