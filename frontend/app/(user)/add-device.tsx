import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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
import { addDevice } from "../../src/api";

export default function AddDeviceScreen() {
  const [form, setForm] = useState({
    deviceId: "",
    deviceEmail: "",
    secret: "",
    name: "",
    greenHouseLocation: "",
  });
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const update = (key: string) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleAdd() {
    if (!form.deviceId || !form.deviceEmail || !form.secret) {
      Alert.alert("Error", "Device ID, Email and Secret are required");
      return;
    }
    setLoading(true);
    try {
      const res = await addDevice(form);
      if (res.message === "Device added successfully") {
        setAdded(true);
      } else {
        Alert.alert("Error", res.message || "Failed to add device");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Try again.");
    }
    setLoading(false);
  }

  // Success state
  if (added) {
    return (
      <View style={s.successScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#0B131E" />
        <View style={s.successIconBox}>
          <Ionicons name="checkmark-circle" size={54} color="#34D399" />
        </View>
        <Text style={s.successTitle}>Device Added!</Text>
        <Text style={s.successSub}>
          Your sensor hardware is now linked and streaming live telemetry data. Return to Home to view real-time metrics.
        </Text>
        <View style={s.successBtnRow}>
          <TouchableOpacity
            style={s.successPrimaryBtn}
            onPress={() => router.replace("/(user)")}
            activeOpacity={0.85}
          >
            <Ionicons name="home-outline" size={16} color="#FFFFFF" />
            <Text style={s.successPrimaryBtnText}>Go to Home</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.successSecondaryBtn}
            onPress={() => {
              setAdded(false);
              setForm({
                deviceId: "",
                deviceEmail: "",
                secret: "",
                name: "",
                greenHouseLocation: "",
              });
            }}
            activeOpacity={0.8}
          >
            <Text style={s.successSecondaryBtnText}>Add Another</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        {/* Back Button */}
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

        {/* Title Header */}
        <View style={s.badgePill}>
          <View style={s.badgePulseDot} />
          <Text style={s.badgePillText}>HARDWARE PROVISIONING</Text>
        </View>
        <Text style={s.title}>Add Device</Text>
        <Text style={s.subtitle}>
          Enter the credentials from your approved hardware request
        </Text>

        {/* Info Banner */}
        <View style={s.infoBanner}>
          <View style={s.infoBannerIconBox}>
            <Ionicons name="information-circle" size={18} color="#38BDF8" />
          </View>
          <Text style={s.infoBannerText}>
            Find your assigned credentials in{" "}
            <Text style={s.infoBannerBold}>Devices → Requests</Text> once your order is approved.
          </Text>
        </View>

        {/* Required Credentials Card */}
        <View style={s.sectionLabel}>
          <Text style={s.sectionLabelText}>REQUIRED CREDENTIALS</Text>
        </View>

        <View style={s.card}>
          {/* Device ID */}
          <View style={s.group}>
            <Text style={s.label}>
              DEVICE ID <Text style={s.required}>*</Text>
            </Text>
            <View style={s.inputRow}>
              <View style={[s.inputIconBox, { backgroundColor: "rgba(52, 211, 153, 0.12)" }]}>
                <MaterialCommunityIcons name="chip" size={16} color="#34D399" />
              </View>
              <TextInput
                style={s.inputField}
                placeholder="esp-7a741b4e"
                placeholderTextColor="#64748B"
                value={form.deviceId}
                onChangeText={update("deviceId")}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={s.divider} />

          {/* Device Email */}
          <View style={s.group}>
            <Text style={s.label}>
              DEVICE EMAIL <Text style={s.required}>*</Text>
            </Text>
            <View style={s.inputRow}>
              <View style={[s.inputIconBox, { backgroundColor: "rgba(56, 189, 248, 0.12)" }]}>
                <Ionicons name="mail-outline" size={16} color="#38BDF8" />
              </View>
              <TextInput
                style={s.inputField}
                placeholder="esp-7a741b4e@agrix.com"
                placeholderTextColor="#64748B"
                value={form.deviceEmail}
                onChangeText={update("deviceEmail")}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={s.divider} />

          {/* Secret */}
          <View style={s.group}>
            <Text style={s.label}>
              SECRET <Text style={s.required}>*</Text>
            </Text>
            <View style={s.inputRow}>
              <View style={[s.inputIconBox, { backgroundColor: "rgba(167, 139, 250, 0.12)" }]}>
                <Ionicons name="key-outline" size={16} color="#A78BFA" />
              </View>
              <TextInput
                style={[s.inputField, { flex: 1 }]}
                placeholder="b7af9b188ffe9dac"
                placeholderTextColor="#64748B"
                value={form.secret}
                onChangeText={update("secret")}
                secureTextEntry={!showSecret}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowSecret(!showSecret)}
                style={s.eyeBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showSecret ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Optional Section */}
        <View style={s.optionalHeader}>
          <View style={s.optionalLine} />
          <Text style={s.optionalText}>OPTIONAL CONFIGURATION</Text>
          <View style={s.optionalLine} />
        </View>

        <View style={s.card}>
          {/* Device Name */}
          <View style={s.group}>
            <Text style={s.label}>DEVICE NAME</Text>
            <View style={s.inputRow}>
              <View style={[s.inputIconBox, { backgroundColor: "rgba(251, 191, 36, 0.12)" }]}>
                <Ionicons name="pricetag-outline" size={15} color="#FBBF24" />
              </View>
              <TextInput
                style={s.inputField}
                placeholder="e.g. Greenhouse Zone A"
                placeholderTextColor="#64748B"
                value={form.name}
                onChangeText={update("name")}
              />
            </View>
          </View>

          <View style={s.divider} />

          {/* Location */}
          <View style={s.group}>
            <Text style={s.label}>LOCATION / SECTOR</Text>
            <View style={s.inputRow}>
              <View style={[s.inputIconBox, { backgroundColor: "rgba(248, 113, 113, 0.12)" }]}>
                <Ionicons name="location-outline" size={16} color="#F87171" />
              </View>
              <TextInput
                style={s.inputField}
                placeholder="e.g. North Wing, Sector 2"
                placeholderTextColor="#64748B"
                value={form.greenHouseLocation}
                onChangeText={update("greenHouseLocation")}
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitBtnDisabled]}
          onPress={handleAdd}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="antenna" size={18} color="#FFFFFF" />
              <Text style={s.submitBtnText}>Pair & Connect Device</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { padding: 18, paddingBottom: 60 },

  /* Back Button */
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

  /* Header Group */
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
    lineHeight: 18,
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(56, 189, 248, 0.1)",
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.25)",
    marginBottom: 20,
  },
  infoBannerIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoBannerText: { flex: 1, color: "#93C5FD", fontSize: 12, lineHeight: 18 },
  infoBannerBold: { fontWeight: "800", color: "#FFFFFF" },

  /* Section Labels */
  sectionLabel: { marginBottom: 8 },
  sectionLabelText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1.2,
  },

  /* Card & Inputs */
  card: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
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

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#162334",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
  },
  inputIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputField: { flex: 1, paddingVertical: 8, color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  eyeBtn: { padding: 8 },

  /* Optional Divider Header */
  optionalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 10,
  },
  optionalLine: { flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.06)" },
  optionalText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 1.2,
  },

  /* Submit Button */
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
  submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },

  /* Success Screen */
  successScreen: {
    flex: 1,
    backgroundColor: "#0B131E",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  successIconBox: {
    width: 90,
    height: 90,
    borderRadius: 24,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  successSub: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  successBtnRow: { flexDirection: "row", gap: 10, width: "100%" },
  successPrimaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 15,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  successPrimaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  successSecondaryBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#162334",
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  successSecondaryBtnText: {
    color: "#34D399",
    fontWeight: "800",
    fontSize: 14,
  },
});