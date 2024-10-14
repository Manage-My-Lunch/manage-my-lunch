import { Platform } from 'react-native';
import React from 'react';
import { Tabs } from 'expo-router';
import { Entypo, Ionicons } from '@expo/vector-icons';

const TabsLayout = () => {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00BFA6',
        tabBarInactiveTintColor: '#gray',
        tabBarStyle: {
          position: Platform.OS === 'web' ? 'absolute' : 'relative',
          bottom: Platform.OS === 'web' ? 'auto' : 0,
          top: Platform.OS === 'web' ? 0 : 'auto',
          backgroundColor: '#F7F9FC',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color }) => (
            <Entypo name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default TabsLayout;
