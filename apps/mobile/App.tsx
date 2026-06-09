/**
 * Simcoin mobile app — Phase 2 navigation shell.
 *
 * A bottom-tab navigator with four placeholder screens (Markets, Portfolio,
 * Leaderboard, Learn) mirroring the web app's `(app)` section. It shares the
 * `@simcoin/sdk` client and `@simcoin/types` with apps/web, so both clients
 * speak the identical API contract.
 *
 * TODO (Phase 2): real auth (SecureStore + OAuth/wallet), live data via the SDK,
 * a trade screen, and WebSocket price streaming.
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  LeaderboardScreen,
  LearnScreen,
  MarketsScreen,
  PortfolioScreen,
} from './src/screens';

export type RootTabParamList = {
  Markets: undefined;
  Portfolio: undefined;
  Leaderboard: undefined;
  Learn: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

const theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: '#0a0f1e',
    card: '#121829',
    text: '#f8fafc',
    border: '#1e293b',
    primary: '#1bbf78',
    notification: '#a855f7',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1bbf78',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: { backgroundColor: '#121829', borderTopColor: '#1e293b' },
        }}
      >
        <Tab.Screen name="Markets" component={MarketsScreen} />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Tab.Screen name="Learn" component={LearnScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
