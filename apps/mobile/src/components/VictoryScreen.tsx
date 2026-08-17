import React from 'react';
import { View, Text } from 'react-native';
import { VICTORY_MIN_STORE_COUNT } from '@coffee-empire/core';
import { useGameStore } from '../state/gameStore';
import { AppButton } from './AppButton';
import { StarIcon } from '../icons';
import { colors } from '../theme/theme';

/**
 * isVictoryAchieved(HD化+IPO+店舗数VICTORY_MIN_STORE_COUNT以上)達成時の全画面演出。
 * BankruptcyScreenと対になる構成だが、こちらはゲームオーバーではないため
 * 「続けてプレイする」で閉じられる(victoryScreenDismissedは保存されない一時的なUI状態で、
 * 再訪問時にまた表示されてもゲーム進行には影響しない)。
 */
export function VictoryScreen() {
  const isVictoryAchieved = useGameStore((s) => s.state.isVictoryAchieved);
  const victoryScreenDismissed = useGameStore((s) => s.victoryScreenDismissed);
  const turn = useGameStore((s) => s.state.turn);
  const storeCount = useGameStore((s) => s.state.stores.length);
  const dismissVictoryScreen = useGameStore((s) => s.dismissVictoryScreen);

  if (!isVictoryAchieved || victoryScreenDismissed) return null;

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/85 px-lg">
      <View
        className="w-full max-w-[420px] items-center gap-md rounded-lg border p-lg"
        style={{
          borderColor: colors.gold,
          backgroundColor: colors.surface,
          shadowColor: colors.gold,
          shadowOpacity: 0.6,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 0 },
          elevation: 12,
        }}
      >
        <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(232,162,61,0.18)' }}>
          <StarIcon size={32} color={colors.gold} />
        </View>
        <Text className="text-center text-xl font-extrabold" style={{ color: colors.gold }}>
          メガチェーン達成
        </Text>
        <Text className="text-center text-sm text-text-secondary">
          持株会社体制への移行・株式公開(IPO)・{VICTORY_MIN_STORE_COUNT}店舗以上の同時展開を達成しました(T{turn}
          ・現在{storeCount}店舗)。個人経営から始まった事業が、名実ともに一大コーヒーチェーンへと成長しました。
        </Text>
        <AppButton label="続けてプレイする" icon="checkmark-circle" onPress={dismissVictoryScreen} />
      </View>
    </View>
  );
}
