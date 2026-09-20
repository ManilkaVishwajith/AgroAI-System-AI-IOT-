import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { register } from "../../src/api";

export default function RegisterScreen() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCPw, setShowCPw] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (v: string) =>
    setForm((p) => ({ ...p, [k]: v }));

  const strength =
    form.password.length === 0
      ? null
      : form.password.length < 8
      ? { label: "Too short", color: "#EF4444", bg: "#FEE2E2", pct: 25 }
      : form.password.length < 12
      ? { label: "Fair", color: "#F59E0B", bg: "#FEF3C7", pct: 60 }
      : { label: "Strong", color: "#16A34A", bg: "#DCFCE7", pct: 100 };

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  async function handleRegister() {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await register(form);
      if (res.message === "User created successfully") {
        Alert.alert("Success", "Account created! Please login.", [
          { text: "OK", onPress: () => router.replace("/(auth)/login") },
        ]);
      } else {
        Alert.alert("Error", res.message || "Registration failed");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.forestDeep} />
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* =====================================
            TOP HERO SECTION
        ===================================== */}
        <View style={styles.hero}>
          <View style={styles.glowCircleOne} />
          <View style={styles.glowCircleTwo} />

          {/* Navigation & Brand Header */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.brandRow}>
              <View style={styles.logoBox}>
                <Image
                  source={require("../../assets/images/agroai.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.brandName}>AgroAI</Text>
                <Text style={styles.brandCaption}>AI-POWERED AGRICULTURE</Text>
              </View>
            </View>
          </View>

          {/* Hero Headlines */}
          <View style={styles.heroTextContainer}>
            <View style={styles.badgeContainer}>
              <Ionicons
                name="sparkles"
                size={11}
                color={COLORS.emeraldLight}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.heroBadgeText}>JOIN THE NETWORK</Text>
            </View>
            <Text style={styles.heroTitle}>Create your</Text>
            <Text style={styles.heroTitleAccent}>AgroAI account.</Text>
            <Text style={styles.heroDescription}>
              Unlock smart farm analytics, real-time crop health monitoring, and personalized yield insights.
            </Text>
          </View>
        </View>

        {/* =====================================
            REGISTRATION FORM CARD
        ===================================== */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.headingContainer}>
              <Text style={styles.cardTitle}>Get Started</Text>
              <Text style={styles.cardSubtitle}>
                Enter your details to create an account
              </Text>
            </View>

            {/* First & Last Name Row */}
            <View style={styles.nameRow}>
              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.label}>FIRST NAME *</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === "firstName" && styles.inputContainerFocused,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="John"
                    placeholderTextColor={COLORS.placeholder}
                    value={form.firstName}
                    onChangeText={set("firstName")}
                    onFocus={() => setFocusedField("firstName")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <View style={[styles.fieldContainer, { flex: 1 }]}>
                <Text style={styles.label}>LAST NAME *</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === "lastName" && styles.inputContainerFocused,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    placeholder="Doe"
                    placeholderTextColor={COLORS.placeholder}
                    value={form.lastName}
                    onChangeText={set("lastName")}
                    onFocus={() => setFocusedField("lastName")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>EMAIL ADDRESS *</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === "email" && styles.inputContainerFocused,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={
                      focusedField === "email"
                        ? COLORS.primaryGreen
                        : COLORS.grayText
                    }
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="farmer@agroai.com"
                  placeholderTextColor={COLORS.placeholder}
                  value={form.email}
                  onChangeText={set("email")}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>PASSWORD *</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === "password" && styles.inputContainerFocused,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={
                      focusedField === "password"
                        ? COLORS.primaryGreen
                        : COLORS.grayText
                    }
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Min. 8 characters"
                  placeholderTextColor={COLORS.placeholder}
                  value={form.password}
                  onChangeText={set("password")}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPw(!showPw)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPw ? "eye-off-outline" : "eye-outline"}
                    size={19}
                    color={COLORS.grayText}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Strength Indicator */}
              {strength && (
                <View style={styles.strengthRow}>
                  <View style={styles.strengthTrack}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${strength.pct}%` as any,
                          backgroundColor: strength.color,
                        },
                      ]}
                    />
                  </View>
                  <View
                    style={[
                      styles.strengthBadge,
                      { backgroundColor: strength.bg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.strengthBadgeText,
                        { color: strength.color },
                      ]}
                    >
                      {strength.label}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* Confirm Password Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>CONFIRM PASSWORD *</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === "confirmPassword" &&
                    styles.inputContainerFocused,
                ]}
              >
                <View style={styles.iconContainer}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color={
                      focusedField === "confirmPassword"
                        ? COLORS.primaryGreen
                        : COLORS.grayText
                    }
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter password"
                  placeholderTextColor={COLORS.placeholder}
                  value={form.confirmPassword}
                  onChangeText={set("confirmPassword")}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField(null)}
                  secureTextEntry={!showCPw}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCPw(!showCPw)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showCPw ? "eye-off-outline" : "eye-outline"}
                    size={19}
                    color={COLORS.grayText}
                  />
                </TouchableOpacity>
              </View>

              {/* Match Feedback Badge */}
              {form.confirmPassword.length > 0 && (
                <View
                  style={[
                    styles.matchRow,
                    {
                      backgroundColor: passwordsMatch ? "#DCFCE7" : "#FEE2E2",
                      borderColor: passwordsMatch ? "#BBF7D0" : "#FECACA",
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      passwordsMatch ? "checkmark-circle" : "close-circle"
                    }
                    size={14}
                    color={passwordsMatch ? "#16A34A" : "#EF4444"}
                  />
                  <Text
                    style={[
                      styles.matchText,
                      { color: passwordsMatch ? "#15803D" : "#B91C1C" },
                    ]}
                  >
                    {passwordsMatch
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </Text>
                </View>
              )}
            </View>

            {/* Create Account Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                loading && styles.createButtonDisabled,
              ]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.createButtonText}>Create Account</Text>
                  <View style={styles.buttonArrow}>
                    <Ionicons
                      name="arrow-forward"
                      size={16}
                      color={COLORS.primaryGreen}
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Sign In Link */}
            <View style={styles.loginArea}>
              <Text style={styles.loginAreaText}>Already have an account?</Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.7}
              >
                <Text style={styles.loginAreaLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            {/* Security Guarantee */}
            <View style={styles.securityContainer}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={COLORS.primaryGreen}
              />
              <Text style={styles.securityText}>
                End-to-End Encrypted & Secure
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* =========================================
   AGRO-AI GREEN DESIGN SYSTEM
========================================= */

const COLORS = {
  forestDeep: "#0A1F18",
  forestCard: "#132D24",

  primaryGreen: "#16A34A",
  emeraldLight: "#4ADE80",
  greenTint: "rgba(22, 163, 74, 0.12)",

  bgSoft: "#F3F7F4",
  cardBg: "#FFFFFF",

  textHeading: "#0F291E",
  textSub: "#5B7367",
  label: "#3D564A",
  placeholder: "#94A99E",
  grayText: "#6B8477",

  borderLight: "#E1EBE4",
  borderFocus: "#16A34A",
  inputBg: "#F7FAF8",
};

/* =========================================
   STYLES
========================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bgSoft,
  },

  container: {
    flexGrow: 1,
  },

  /* Hero Section */
  hero: {
    backgroundColor: COLORS.forestDeep,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 52 : 36,
    paddingBottom: 60,
    position: "relative",
    overflow: "hidden",
  },

  glowCircleOne: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(74, 222, 128, 0.08)",
    top: -50,
    right: -60,
  },

  glowCircleTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(22, 163, 74, 0.06)",
    bottom: -20,
    left: -40,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  logo: {
    width: 24,
    height: 24,
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  brandCaption: {
    color: "#8FAFA0",
    fontSize: 7.5,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 1,
  },

  heroTextContainer: {
    marginTop: 24,
  },

  badgeContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderColor: "rgba(74, 222, 128, 0.35)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },

  heroBadgeText: {
    color: COLORS.emeraldLight,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 32,
  },

  heroTitleAccent: {
    color: COLORS.emeraldLight,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 32,
  },

  heroDescription: {
    color: "#A2C2B3",
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 6,
    maxWidth: "92%",
  },

  /* Form Card */
  cardContainer: {
    marginTop: -28,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    shadowColor: "#0A1F18",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },

  headingContainer: {
    marginBottom: 20,
  },

  cardTitle: {
    color: COLORS.textHeading,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  cardSubtitle: {
    color: COLORS.textSub,
    fontSize: 12.5,
    marginTop: 3,
  },

  nameRow: {
    flexDirection: "row",
    gap: 12,
  },

  fieldContainer: {
    marginBottom: 16,
  },

  label: {
    color: COLORS.label,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 6,
  },

  inputContainer: {
    height: 50,
    backgroundColor: COLORS.inputBg,
    borderRadius: 13,
    borderWidth: 1.2,
    borderColor: COLORS.borderLight,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  inputContainerFocused: {
    borderColor: COLORS.borderFocus,
    backgroundColor: "#FFFFFF",
  },

  iconContainer: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: COLORS.textHeading,
    fontSize: 14,
    height: "100%",
  },

  eyeButton: {
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
  },

  /* Strength Tracker */
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 6,
  },

  strengthTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },

  strengthFill: {
    height: "100%",
    borderRadius: 2,
  },

  strengthBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  strengthBadgeText: {
    fontSize: 9.5,
    fontWeight: "700",
  },

  /* Password Match Feedback */
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    marginTop: 6,
  },

  matchText: {
    fontSize: 11,
    fontWeight: "600",
  },

  /* Submit Button */
  createButton: {
    height: 52,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  createButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },

  createButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 8,
  },

  buttonArrow: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Footer Links */
  loginArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
  },

  loginAreaText: {
    color: COLORS.textSub,
    fontSize: 13,
  },

  loginAreaLink: {
    color: COLORS.primaryGreen,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 5,
  },

  securityContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 18,
    gap: 6,
  },

  securityText: {
    color: COLORS.grayText,
    fontSize: 11,
    fontWeight: "500",
  },
});