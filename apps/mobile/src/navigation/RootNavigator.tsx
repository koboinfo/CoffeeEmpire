import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FinancialsScreen } from '../screens/FinancialsScreen';
import { MapScreen } from '../screens/MapScreen';
import { StoreListScreen } from '../screens/StoreListScreen';
import { NewStoreScreen } from '../screens/NewStoreScreen';
import { StoreDetailScreen } from '../screens/StoreDetailScreen';
import { CorporateScreen } from '../screens/CorporateScreen';
import { RealEstateScreen } from '../screens/RealEstateScreen';
import { SupplyChainScreen } from '../screens/SupplyChainScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { colors } from '../theme/theme';

export type TabParamList = {
  Dashboard: undefined;
  StoreList: undefined;
  Map: undefined;
  SupplyChain: undefined;
  Corporate: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  Financials: undefined;
  NewStore: { cityId?: string } | undefined;
  StoreDetail: { storeId: string };
  RealEstate: undefined;
  News: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const TAB_ICONS: Record<keyof TabParamList, keyof typeof Ionicons.glyphMap> = {
  Dashboard: 'home',
  StoreList: 'storefront',
  Map: 'map',
  SupplyChain: 'flame',
  Corporate: 'briefcase',
};

const TAB_LABELS: Record<keyof TabParamList, string> = {
  Dashboard: '経営',
  StoreList: '店舗',
  Map: 'マップ',
  SupplyChain: '焙煎',
  Corporate: '企業',
};

function TabNavigator() {
  return (
    <View style={styles.tabWrapper}>
      <Tab.Navigator
        screenOptions={({ route }: { route: { name: keyof TabParamList } }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.roast,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
          tabBarLabel: TAB_LABELS[route.name as keyof TabParamList],
          tabBarIcon: ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
            <Ionicons
              name={focused ? TAB_ICONS[route.name as keyof TabParamList] : (`${String(TAB_ICONS[route.name as keyof TabParamList])}-outline` as keyof typeof Ionicons.glyphMap)}
              size={size}
              color={color}
            />
          ),
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="StoreList" component={StoreListScreen} />
        <Tab.Screen name="Map" component={MapScreen} />
        <Tab.Screen name="SupplyChain" component={SupplyChainScreen} />
        <Tab.Screen name="Corporate" component={CorporateScreen} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  tabWrapper: { flex: 1 },
});

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.header },
        headerTintColor: colors.white,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Financials" component={FinancialsScreen} options={{ title: '財務諸表' }} />
      <Stack.Screen name="NewStore" component={NewStoreScreen} options={{ title: '新規出店' }} />
      <Stack.Screen name="StoreDetail" component={StoreDetailScreen} options={{ title: '店舗詳細' }} />
      <Stack.Screen name="RealEstate" component={RealEstateScreen} options={{ title: '不動産投資' }} />
      <Stack.Screen name="News" component={NewsScreen} options={{ title: 'ニュース' }} />
    </Stack.Navigator>
  );
}
