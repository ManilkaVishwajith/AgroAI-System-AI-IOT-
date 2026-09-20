import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { clearStorage, getUser } from "../../src/utils/storage";

export default function SettingsScreen() {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearStorage();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;
  const roleLabel = user?.role?.toUpperCase() || "FARMER";

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B131E" />

      {/* Header */}
      <View style={s.header}>
        <View style={s.badgePill}>
          <View style={s.badgePulseDot} />
          <Text style={s.badgePillText}>SYSTEM PREFERENCES</Text>
        </View>
        <Text style={s.title}>Settings</Text>
        <Text style={s.subtitle}>Account & platform configuration</Text>
      </View>

      {/* Profile card */}
      <View style={s.profileCard}>
        <View style={s.avatarCircle}>
          <Text style={s.avatarText}>{initials || "AG"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={s.profileEmail}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Ionicons name="leaf" size={10} color="#34D399" />
            <Text style={s.roleText}>{roleLabel}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={s.editBtn}
          onPress={() => router.push("/(user)/edit-profile")}
          activeOpacity={0.8}
        >
          <Ionicons name="pencil-outline" size={14} color="#34D399" />
          <Text style={s.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Account section */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>ACCOUNT</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.row}
            onPress={() => router.push("/(user)/edit-profile")}
            activeOpacity={0.8}
          >
            <View style={[s.rowIconBox, { backgroundColor: "rgba(56, 189, 248, 0.12)" }]}>
              <Ionicons name="person-outline" size={16} color="#38BDF8" />
            </View>
            <Text style={s.rowLabel}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity
            style={s.row}
            onPress={() => router.push("/(user)/change-password")}
            activeOpacity={0.8}
          >
            <View style={[s.rowIconBox, { backgroundColor: "rgba(167, 139, 250, 0.12)" }]}>
              <Ionicons name="key-outline" size={16} color="#A78BFA" />
            </View>
            <Text style={s.rowLabel}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Devices section */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>DEVICES</Text>
        <View style={s.card}>
          <TouchableOpacity
            style={s.row}
            onPress={() => router.push("/(user)/add-device")}
            activeOpacity={0.8}
          >
            <View style={[s.rowIconBox, { backgroundColor: "rgba(52, 211, 153, 0.12)" }]}>
              <Ionicons name="add-circle-outline" size={16} color="#34D399" />
            </View>
            <Text style={s.rowLabel}>Add New Device</Text>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity
            style={s.row}
            onPress={() => router.push("/(user)/request-device")}
            activeOpacity={0.8}
          >
            <View style={[s.rowIconBox, { backgroundColor: "rgba(251, 146, 60, 0.12)" }]}>
              <Ionicons name="cube-outline" size={16} color="#FB923C" />
            </View>
            <Text style={s.rowLabel}>Request a Device</Text>
            <Ionicons name="chevron-forward" size={16} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Preferences section */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>PREFERENCES</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.rowIconBox, { backgroundColor: "rgba(251, 191, 36, 0.12)" }]}>
              <Ionicons
                name="notifications-outline"
                size={16}
                color="#FBBF24"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>Notifications</Text>
              <Text style={s.rowSub}>Sensor alerts and telemetry updates</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#162334", true: "#10B981" }}
              thumbColor={notifications ? "#FFFFFF" : "#64748B"}
            />
          </View>
        </View>
      </View>

      {/* About section */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>ABOUT</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.rowIconBox, { backgroundColor: "rgba(148, 163, 184, 0.12)" }]}>
              <Ionicons
                name="phone-portrait-outline"
                size={16}
                color="#94A3B8"
              />
            </View>
            <Text style={s.rowLabel}>App Version</Text>
            <Text style={s.rowValue}>v1.0.0</Text>
          </View>
          <View style={s.divider} />
          <View style={s.row}>
            <View style={[s.rowIconBox, { backgroundColor: "rgba(52, 211, 153, 0.12)" }]}>
              <MaterialCommunityIcons
                name="sprout-outline"
                size={16}
                color="#34D399"
              />
            </View>
            <Text style={s.rowLabel}>Platform</Text>
            <Text style={s.rowValue}>AgroAi Smart Farm</Text>
          </View>
        </View>
      </View>

      {/* Logout */}
      <View style={s.section}>
        <TouchableOpacity
          style={s.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#F87171" />
          <Text style={s.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B131E" },

  // Header
  header: {
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  badgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#34D399",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "600",
  },

  // Profile card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    backgroundColor: "#101D2B",
    borderRadius: 20,
    padding: 16,
    marginBottom: 22,
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  avatarText: { color: "#34D399", fontSize: 18, fontWeight: "900" },
  profileName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  profileEmail: { color: "#94A3B8", fontSize: 11.5, marginBottom: 6 },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    alignSelf: "flex-start",
  },
  roleText: {
    color: "#34D399",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#162334",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  editBtnText: { color: "#34D399", fontSize: 12, fontWeight: "700" },

  // Section
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionLabel: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  // Card + rows
  card: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  rowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  rowSub: { color: "#64748B", fontSize: 11, marginTop: 1 },
  rowValue: { color: "#94A3B8", fontSize: 12.5, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.05)", marginHorizontal: 14 },

  // Logout
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderRadius: 16,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
    marginTop: 4,
  },
  logoutText: { color: "#F87171", fontSize: 14.5, fontWeight: "800" },
});