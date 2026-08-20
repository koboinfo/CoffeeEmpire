import './global.css';
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { HudBar } from './src/components/HudBar';
import { EventAlertModal } from './src/components/EventAlertModal';
import { SettlementModal } from './src/components/SettlementModal';
import { BankruptcyScreen } from './src/components/BankruptcyScreen';
import { BoardDismissalScreen } from './src/components/BoardDismissalScreen';
import { VictoryScreen } from './src/components/VictoryScreen';
import { AchievementToast } from './src/components/AchievementToast';
import { OnboardingModal } from './src/components/OnboardingModal';
import { useGameStore } from './src/state/gameStore';
import { colors } from './src/theme/theme';

export default function App() {
  const hydrate = useGameStore((store) => store.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={styles.root}>
          <NavigationContainer>
            <HudBar />
            <RootNavigator />
          </NavigationContainer>
          <EventAlertModal />
          <SettlementModal />
          <AchievementToast />
          <BankruptcyScreen />
          <BoardDismissalScreen />
          <VictoryScreen />
          <OnboardingModal />
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
