import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../state/gameStore';
import { AppButton } from './AppButton';
import { WarningIcon } from '../icons';
import { colors } from '../theme/theme';

/**
 * isBoardDismissed(取締役会による解任)時に全画面表示するゲームオーバー演出。
 * BankruptcyScreen.tsxと同じパターン: App.tsxでHudBar/NavigationContainerより上に重ねて表示し、
 * 以後の操作を実質ブロックする(coreSlice.advance()自体もisBoardDismissed時は早期returnするため、
 * 二重の防御になっている)。
 */
export function BoardDismissalScreen() {
  const isBoardDismissed = useGameStore((s) => s.state.isBoardDismissed ?? false);
  const turn = useGameStore((s) => s.state.turn);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!isBoardDismissed) return null;

  return (
    <View className="absolute inset-0 z-50 items-center justify-center bg-black/85 px-lg">
      <View
        className="w-full max-w-[420px] items-center gap-md rounded-lg border p-lg"
        style={{
          borderColor: colors.negative,
          backgroundColor: colors.surface,
          shadowColor: colors.negative,
          shadowOpacity: 0.6,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 0 },
          elevation: 12,
        }}
      >
        <View
          className="h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(226,86,75,0.18)' }}
        >
          <WarningIcon size={32} color={colors.negative} />
        </View>
        <Text className="text-center text-xl font-extrabold" style={{ color: colors.negative }}>
          取締役会により解任
        </Text>
        <Text className="text-center text-sm text-text-secondary">
          継続的な赤字・無配・株価下落により株主・取締役会の信任を失い、経営者として解任されました(T{turn})。
          上場企業には常に株主への説明責任が伴います。
        </Text>
        <AppButton label="新しい会社で再スタート" icon="refresh" onPress={resetGame} />
      </View>
    </View>
  );
}
