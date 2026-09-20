import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { jwtDecode } from "jwt-decode";
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
import { login } from "../../src/api";
import { saveToken, saveUser } from "../../src/utils/storage";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim(), password);

      if (res?.token) {
        await saveToken(res.token);
        const decoded: any = jwtDecode(res.token);
        await saveUser(decoded);
        router.replace("/(user)");
      } else {
        Alert.alert("Error", res?.message || "Login failed");
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
          {/* Subtle Ambient Green Glow */}
          <View style={styles.glowCircleOne} />
          <View style={styles.glowCircleTwo} />

          {/* Top Brand Header */}
          <View style={styles.topRow}>
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

          {/* Hero Headlines */}
          <View style={styles.heroTextContainer}>
            <View style={styles.badgeContainer}>
              <Ionicons name="sparkles" size={11} color={COLORS.emeraldLight} style={{ marginRight: 4 }} />
              <Text style={styles.heroBadgeText}>AI PRECISION FARMING</Text>
            </View>
            <Text style={styles.heroTitle}>Farm smarter,</Text>
            <Text style={styles.heroTitleAccent}>grow with AI.</Text>
            <Text style={styles.heroDescription}>
              Real-time crop diagnostics, weather predictions, and yield optimization powered by artificial intelligence.
            </Text>
          </View>
        </View>

        {/* =====================================
            MAIN CARD / LOGIN SECTION
        ===================================== */}
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            {/* Heading */}
            <View style={styles.headingContainer}>
              <Text style={styles.loginTitle}>Welcome Back</Text>
              <Text style={styles.loginSubtitle}>Sign in to your AgroAI dashboard</Text>
            </View>

            {/* Email Field */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View
                style={[
                  styles.inputContainer,
                  focusedField === "email" && styles.inputContainerFocused,
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    focusedField === "email" && styles.iconContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={focusedField === "email" ? COLORS.primaryGreen : COLORS.grayText}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="name@agroai.com"
                  placeholderTextColor={COLORS.placeholder}
                  value={email}
                  onChangeText={setEmail}
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
              <View style={styles.passwordLabelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.inputContainer,
                  focusedField === "password" && styles.inputContainerFocused,
                ]}
              >
                <View
                  style={[
                    styles.iconContainer,
                    focusedField === "password" && styles.iconContainerFocused,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={focusedField === "password" ? COLORS.primaryGreen : COLORS.grayText}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={COLORS.placeholder}
                  value={password}
                  onChangeText={setPassword}
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
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In to AgroAI</Text>
                  <View style={styles.buttonArrow}>
                    <Ionicons name="arrow-forward" size={16} color={COLORS.primaryGreen} />
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerArea}>
              <Text style={styles.registerText}>New to AgroAI?</Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Trust / Security Badge */}
            <View style={styles.securityContainer}>
              <Ionicons name="shield-checkmark" size={14} color={COLORS.primaryGreen} />
              <Text style={styles.securityText}>End-to-End Encrypted & Secure</Text>
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
  forestDeep: "#0A1F18", // Dark Green-Navy Header Background
  forestCard: "#132D24",

  primaryGreen: "#16A34A", // Vibrant Emerald/Leaf Green
  emeraldLight: "#4ADE80", // Accent Mint/Glow Green
  greenTint: "rgba(22, 163, 74, 0.12)",

  bgSoft: "#F3F7F4", // Soft Off-White/Greenish Gray BG
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
    paddingHorizontal: 26,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 68,
    position: "relative",
    overflow: "hidden",
  },

  glowCircleOne: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(74, 222, 128, 0.08)",
    top: -60,
    right: -70,
  },

  glowCircleTwo: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(22, 163, 74, 0.06)",
    bottom: -30,
    left: -50,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },

  logo: {
    width: 28,
    height: 28,
  },

  brandName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  brandCaption: {
    color: "#8FAFA0",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginTop: 1,
  },

  heroTextContainer: {
    marginTop: 28,
  },

  badgeContainer: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74, 222, 128, 0.12)",
    borderColor: "rgba(74, 222, 128, 0.35)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 6,
    marginBottom: 12,
  },

  heroBadgeText: {
    color: COLORS.emeraldLight,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 34,
  },

  heroTitleAccent: {
    color: COLORS.emeraldLight,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 34,
  },

  heroDescription: {
    color: "#A2C2B3",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    maxWidth: "92%",
  },

  /* Card Layout */
  cardContainer: {
    marginTop: -32,
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 28,
    shadowColor: "#0A1F18",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 5,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },

  headingContainer: {
    marginBottom: 24,
  },

  loginTitle: {
    color: COLORS.textHeading,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },

  loginSubtitle: {
    color: COLORS.textSub,
    fontSize: 13,
    marginTop: 4,
  },

  /* Inputs */
  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    color: COLORS.label,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    marginBottom: 7,
  },

  passwordLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  forgotText: {
    color: COLORS.primaryGreen,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 7,
  },

  inputContainer: {
    height: 52,
    backgroundColor: COLORS.inputBg,
    borderRadius: 14,
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

  iconContainerFocused: {
    opacity: 1,
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

  /* Submit Button */
  loginButton: {
    height: 54,
    backgroundColor: COLORS.primaryGreen,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    shadowColor: COLORS.primaryGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },

  loginButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
  },

  loginButtonText: {
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
  registerArea: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  registerText: {
    color: COLORS.textSub,
    fontSize: 13,
  },

  registerLink: {
    color: COLORS.primaryGreen,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 5,
  },

  securityContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    gap: 6,
  },

  securityText: {
    color: COLORS.grayText,
    fontSize: 11,
    fontWeight: "500",
  },
});