import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";

export default function UserLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#34D399",
        tabBarInactiveTintColor: "#64748B",
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="devices"
        options={{
          title: "Devices",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? "hardware-chip" : "hardware-chip-outline"}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ai-scan"
        options={{
          title: "AI Scan",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, styles.scanIconWrapper, focused && styles.scanIconWrapperActive]}>
              <Ionicons
                name="scan"
                size={21}
                color={focused ? "#FFFFFF" : "#34D399"}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          title: "Assistant",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <MaterialCommunityIcons
                name={focused ? "robot" : "robot-outline"}
                size={21}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
              <Ionicons
                name={focused ? "settings" : "settings-outline"}
                size={20}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Hidden Routes */}
      <Tabs.Screen name="request-device" options={{ href: null }} />
      <Tabs.Screen name="add-device" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="change-password" options={{ href: null }} />
      <Tabs.Screen name="device/[deviceId]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#0B131E",
    borderTopColor: "rgba(255, 255, 255, 0.08)",
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 88 : 68,
    paddingBottom: Platform.OS === "ios" ? 28 : 10,
    paddingTop: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tabBarLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginTop: 2,
  },
  iconContainer: {
    width: 36,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  iconContainerActive: {
    backgroundColor: "rgba(52, 211, 153, 0.12)",
  },
  scanIconWrapper: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  scanIconWrapperActive: {
    backgroundColor: "#10B981",
    borderColor: "#34D399",
  },
});