/**
 * Tab Layout — Custom bottom tab bar with center FAB
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';
import { FontFamily, Shadows } from '../../constants/Theme';

function CustomTabBar({ state, descriptors, navigation }: any) {
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const isCenter = index === 2; // Scan tab

        const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
          index: isFocused ? 'home' : 'home-outline',
          diary: isFocused ? 'book' : 'book-outline',
          scan: 'add',
          progress: isFocused ? 'stats-chart' : 'stats-chart-outline',
          profile: isFocused ? 'person' : 'person-outline',
        };

        const labelMap: Record<string, string> = {
          index: 'Home',
          diary: 'Diary',
          scan: 'Scan',
          progress: 'Progress',
          profile: 'Profile',
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isCenter) {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.fabContainer}
              onPress={onPress}
              activeOpacity={0.8}
            >
              <View style={[styles.fab, Shadows.fabGlow]}>
                <Ionicons name="add" size={28} color={Colors.onPrimary} />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabItem}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconMap[route.name] || 'ellipse-outline'}
              size={22}
              color={isFocused ? Colors.primary : Colors.textMuted}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? Colors.primary : Colors.textMuted },
              ]}
            >
              {labelMap[route.name] || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="diary" />
      <Tabs.Screen name="scan" />
      <Tabs.Screen name="progress" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    paddingTop: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  tabLabel: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
  },
  fabContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -28,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
