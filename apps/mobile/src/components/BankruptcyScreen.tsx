import React from 'react';
import { View, Text } from 'react-native';
import { useGameStore } from '../state/gameStore';
import { AppButton } from './AppButton';
import { WarningIcon } from '../icons';
import { colors } from '../theme/theme';

/**
 * isBankrupt(黒字倒産)時に全画面表示するゲームオーバー演出。
 * App.tsx でHudBar/NavigationContainerより上に重ねて表示し、以後の操作を実質ブロックする
 * (coreSlice.advance() 自体もisBankrupt時は早期returnするため、二重の防御になっている)。
 */
export function BankruptcyScreen() {
  const isBankrupt = useGameStore((s) => s.state.isBankrupt);
  const turn = useGameStore((s) => s.state.turn);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!isBankrupt) return null;

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
          黒字倒産
        </Text>
        <Text className="text-center text-sm text-text-secondary">
          決算での一括納税により手元資金が枯渇しました(T{turn})。帳簿上は利益が出ていても、納税や仕入れの
          タイミングでキャッシュが尽きると会社は存続できません。
        </Text>
        <AppButton label="新しい会社で再スタート" icon="refresh" onPress={resetGame} />
      </View>
    </View>
  );
}
