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
import { clearStorage, getUser } from "../../src/utils/storage";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function ChangePasswordScreen() {
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));
  const toggleShow = (k: keyof typeof show) =>
    setShow((p) => ({ ...p, [k]: !p[k] }));

  useEffect(() => {
    getUser().then((u) => {
      if (u) setEmail(u.email || "");
    });
  }, []);

  async function handleChange() {
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (form.newPassword.length < 8) {
      Alert.alert("Error", "New password must be at least 8 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (form.newPassword === form.currentPassword) {
      Alert.alert(
        "Error",
        "New password must be different from current password",
      );
      return;
    }
    setLoading(true);
    try {
      const res = await updateProfile(email, { password: form.newPassword });
      if (
        res.message?.toLowerCase().includes("success") ||
        res.message?.toLowerCase().includes("updated")
      ) {
        Alert.alert(
          "Password Changed",
          "You will be signed out now. Please log in again.",
          [
            {
              text: "OK",
              onPress: async () => {
                await clearStorage();
                router.replace("/(auth)/login");
              },
            },
          ],
        );
      } else {
        Alert.alert("Error", res.message || "Could not update password");
      }
    } catch {
      Alert.alert("Error", "Network error. Try again.");
    }
    setLoading(false);
  }

  const strength =
    form.newPassword.length === 0
      ? null
      : form.newPassword.length < 8
        ? { label: "Too short", color: "#F87171", bg: "rgba(248, 113, 113, 0.12)", pct: 25 }
        : form.newPassword.length < 12
          ? { label: "Fair", color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)", pct: 60 }
          : { label: "Strong", color: "#34D399", bg: "rgba(52, 211, 153, 0.15)", pct: 100 };

  const passwordsMatch =
    form.confirmPassword.length > 0 &&
    form.newPassword === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword.length > 0 &&
    form.newPassword !== form.confirmPassword;

  const fields: {
    label: string;
    key: keyof typeof form;
    showKey: keyof typeof show;
    icon: IoniconsName;
  }[] = [
    {
      label: "Current Password",
      key: "currentPassword",
      showKey: "current",
      icon: "key-outline",
    },
    {
      label: "New Password",
      key: "newPassword",
      showKey: "new",
      icon: "lock-closed-outline",
    },
    {
      label: "Confirm Password",
      key: "confirmPassword",
      showKey: "confirm",
      icon: "lock-closed-outline",
    },
  ];

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
          <Text style={s.badgePillText}>SECURITY CREDENTIALS</Text>
        </View>
        <Text style={s.title}>Change Password</Text>
        <Text style={s.subtitle}>Update and strengthen your account authentication</Text>

        {/* Warning banner */}
        <View style={s.warningBanner}>
          <View style={s.warningIconBox}>
            <Ionicons name="warning" size={17} color="#FBBF24" />
          </View>
          <Text style={s.warningText}>
            After changing your password you will be signed out and need to log in again with your new credentials.
          </Text>
        </View>

        {/* Fields */}
        <View style={s.card}>
          {fields.map((field, idx) => (
            <View key={field.key}>
              {idx > 0 && <View style={s.divider} />}
              <View style={s.group}>
                <Text style={s.label}>
                  {field.label.toUpperCase()} <Text style={s.required}>*</Text>
                </Text>
                <View style={s.pwWrap}>
                  <View style={s.fieldIconBox}>
                    <Ionicons name={field.icon} size={15} color="#64748B" />
                  </View>
                  <TextInput
                    style={s.pwInput}
                    placeholder="••••••••"
                    placeholderTextColor="#64748B"
                    value={form[field.key]}
                    onChangeText={set(field.key)}
                    secureTextEntry={!show[field.showKey]}
                  />
                  <TouchableOpacity
                    onPress={() => toggleShow(field.showKey)}
                    style={s.showHideBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        show[field.showKey] ? "eye-off-outline" : "eye-outline"
                      }
                      size={18}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Password strength */}
        {strength && (
          <View style={s.strengthCard}>
            <View style={s.strengthHeader}>
              <Text style={s.strengthTitle}>Password Strength</Text>
              <View style={[s.strengthBadge, { backgroundColor: strength.bg }]}>
                <Text style={[s.strengthBadgeText, { color: strength.color }]}>
                  {strength.label}
                </Text>
              </View>
            </View>
            <View style={s.strengthTrack}>
              <View
                style={[
                  s.strengthFill,
                  {
                    width: `${strength.pct}%` as any,
                    backgroundColor: strength.color,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* Match indicator */}
        {form.confirmPassword.length > 0 && (
          <View
            style={[
              s.matchRow,
              {
                backgroundColor: passwordsMatch ? "rgba(52, 211, 153, 0.12)" : "rgba(248, 113, 113, 0.12)",
                borderColor: passwordsMatch ? "rgba(52, 211, 153, 0.3)" : "rgba(248, 113, 113, 0.3)",
              },
            ]}
          >
            <Ionicons
              name={passwordsMatch ? "checkmark-circle" : "close-circle"}
              size={17}
              color={passwordsMatch ? "#34D399" : "#F87171"}
            />
            <Text
              style={[
                s.matchText,
                { color: passwordsMatch ? "#34D399" : "#F87171" },
              ]}
            >
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitBtnDisabled]}
          onPress={handleChange}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color="#FFFFFF"
              />
              <Text style={s.submitBtnText}>Update Password & Re-login</Text>
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
    marginBottom: 18,
  },

  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(251, 191, 36, 0.1)",
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
    marginBottom: 16,
  },
  warningIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  warningText: {
    flex: 1,
    color: "#FDE68A",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },

  card: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 14,
  },
  divider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.05)" },

  group: { gap: 6 },
  label: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1,
  },
  required: { color: "#F87171" },

  pwWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#162334",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    gap: 8,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 4,
  },
  fieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  pwInput: { flex: 1, paddingVertical: 8, color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  showHideBtn: { padding: 8 },

  strengthCard: {
    backgroundColor: "#111C2A",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 12,
  },
  strengthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  strengthTitle: { fontSize: 11.5, fontWeight: "800", color: "#94A3B8" },
  strengthBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  strengthBadgeText: { fontSize: 10.5, fontWeight: "800" },
  strengthTrack: {
    height: 5,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 2.5,
    overflow: "hidden",
  },
  strengthFill: { height: "100%", borderRadius: 2.5 },

  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  matchText: { fontSize: 12.5, fontWeight: "800" },

  submitBtn: {
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
  submitBtnDisabled: { opacity: 0.45, shadowOpacity: 0 },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});