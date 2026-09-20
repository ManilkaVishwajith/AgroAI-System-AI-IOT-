import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { updateProfile } from "../../src/api";
import { getUser, saveUser } from "../../src/utils/storage";

export default function EditProfileScreen() {
  const [form, setForm] = useState({ firstName: "", lastName: "" });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  useEffect(() => {
    getUser().then((u) => {
      if (u) {
        setForm({ firstName: u.firstName || "", lastName: u.lastName || "" });
        setEmail(u.email || "");
      }
    });
  }, []);

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      Alert.alert("Error", "First and last name are required");
      return;
    }
    setLoading(true);
    try {
      const res = await updateProfile(email, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
      });
      if (
        res.message?.toLowerCase().includes("success") ||
        res.message?.toLowerCase().includes("updated")
      ) {
        const user = await getUser();
        await saveUser({
          ...user,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
        });
        Alert.alert("Saved", "Profile updated successfully.", [
          { text: "OK", onPress: () => router.back() },
        ]);
      } else {
        Alert.alert("Error", res.message || "Update failed");
      }
    } catch {
      Alert.alert("Error", "Network error. Try again.");
    }
    setLoading(false);
  }

  const initials = `${form.firstName?.[0] ?? ""}${form.lastName?.[0] ?? ""}`;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B131E" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B131E" />
      <ScrollView
        contentContainerStyle={s.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <View style={s.backIconBox}>
            <Ionicons name="arrow-back" size={16} color="#34D399" />
          </View>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        <View style={s.badgePill}>
          <View style={s.badgePulseDot} />
          <Text style={s.badgePillText}>ACCOUNT IDENTITY</Text>
        </View>
        <Text style={s.title}>Edit Profile</Text>
        <Text style={s.subtitle}>Update your display name and identity info</Text>

        {/* Avatar hero card */}
        <View style={s.heroCard}>
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{initials || "AG"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.heroName}>
              {form.firstName || "Farmer"} {form.lastName}
            </Text>
            <Text style={s.heroHint}>
              Avatar automatically adapts to your current initials
            </Text>
          </View>
        </View>

        {/* Form card */}
        <View style={s.card}>
          {/* Name row */}
          <View style={s.nameRow}>
            <View style={[s.group, { flex: 1 }]}>
              <Text style={s.label}>
                FIRST NAME <Text style={s.required}>*</Text>
              </Text>
              <TextInput
                style={s.input}
                placeholder="John"
                placeholderTextColor="#64748B"
                value={form.firstName}
                onChangeText={set("firstName")}
              />
            </View>
            <View style={[s.group, { flex: 1 }]}>
              <Text style={s.label}>
                LAST NAME <Text style={s.required}>*</Text>
              </Text>
              <TextInput
                style={s.input}
                placeholder="Doe"
                placeholderTextColor="#64748B"
                value={form.lastName}
                onChangeText={set("lastName")}
              />
            </View>
          </View>

          <View style={s.divider} />

          {/* Email read-only */}
          <View style={s.group}>
            <Text style={s.label}>ACCOUNT EMAIL</Text>
            <View style={s.readOnlyRow}>
              <View style={s.readOnlyIconBox}>
                <Ionicons name="mail-outline" size={16} color="#64748B" />
              </View>
              <Text style={s.readOnlyText} numberOfLines={1}>
                {email}
              </Text>
              <View style={s.lockChip}>
                <Ionicons name="lock-closed" size={11} color="#94A3B8" />
                <Text style={s.lockChipText}>Locked</Text>
              </View>
            </View>
            <Text style={s.fieldHint}>Email address is tied to device ownership and cannot be altered</Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[s.saveBtn, (!dirty || loading) && s.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!dirty || loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={s.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 18, paddingBottom: 60 },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Platform.OS === "ios" ? 48 : 28,
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  backIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#111C2A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { color: "#34D399", fontSize: 13.5, fontWeight: "700" },

  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    color: "#94A3B8",
    fontWeight: "600",
    marginBottom: 20,
  },

  heroCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#101D2B",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarCircle: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  avatarText: { color: "#34D399", fontSize: 20, fontWeight: "900" },
  heroName: { color: "#FFFFFF", fontSize: 16, fontWeight: "800", marginBottom: 3 },
  heroHint: { color: "#94A3B8", fontSize: 11.5, lineHeight: 16 },

  card: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
  },
  nameRow: { flexDirection: "row", gap: 10 },
  divider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.05)" },

  group: { gap: 6 },
  label: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
  },
  required: { color: "#F87171" },

  input: {
    backgroundColor: "#162334",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },

  readOnlyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#162334",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  readOnlyIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  readOnlyText: { flex: 1, color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  lockChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lockChipText: { color: "#94A3B8", fontSize: 10, fontWeight: "700" },
  fieldHint: { color: "#64748B", fontSize: 11, marginTop: 2 },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 4,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  saveBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});