import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getToken, getUser } from "../../src/utils/storage";

export default function SplashScreen() {
  const [checking, setChecking]     = useState(true);
  const [autoLoginFailed, setAutoLoginFailed] = useState(false);

  // Animations
  const logoScale   = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => {
      // Text fades in after logo
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });

    // Check for saved token after a short delay (let animation play)
    setTimeout(() => { checkAutoLogin(); }, 800);
  }, []);

  async function checkAutoLogin() {
    try {
      const token = await getToken();
      const user  = await getUser();

      if (token && user) {
        // Token exists — go straight to app
        router.replace("/(user)");
      } else {
        // No token — show buttons
        setChecking(false);
        Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    } catch {
      setChecking(false);
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }

  return (
    <View style={s.container}>

      {/* Background accent */}
      <View style={s.bgCircleTop} />
      <View style={s.bgCircleBottom} />

      {/* Logo + brand */}
      <View style={s.center}>
        <Animated.View style={[s.logoBox, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Image
            source={require("../../assets/images/agroai.png")}
            style={s.logoImage}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: "center" }}>
          <Text style={s.appName}>AgroAI</Text>
          <Text style={s.tagline}>Smart Farm Intelligence</Text>

          <View style={s.featureRow}>
            {[
              { icon: "hardware-chip-outline" as const, label: "IoT Sensors" },
              { icon: "flask-outline"         as const, label: "AI Scan" },
              { icon: "chatbubbles-outline"   as const, label: "AI Advisor" },
            ].map(f => (
              <View key={f.label} style={s.featureItem}>
                <View style={s.featureIconBox}>
                  <Ionicons name={f.icon} size={16} color="#4caf50" />
                </View>
                <Text style={s.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>

      {/* Buttons (shown when not auto-logging in) */}
      {!checking && (
        <Animated.View style={[s.btnSection, { opacity: btnOpacity }]}>
          <TouchableOpacity
            style={s.loginBtn}
            onPress={() => router.push("/(auth)/login")}
            activeOpacity={0.85}
          >
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={s.loginBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.registerBtn}
            onPress={() => router.push("/(auth)/register")}
            activeOpacity={0.8}
          >
            <Ionicons name="person-add-outline" size={18} color="#4caf50" />
            <Text style={s.registerBtnText}>Create Account</Text>
          </TouchableOpacity>

          <Text style={s.footerText}>AgroAI Smart Farm · v1.0.0</Text>
        </Animated.View>
      )}

      {/* Loading indicator while checking token */}
      {checking && (
        <View style={s.loadingSection}>
          <View style={s.loadingDots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={s.loadingDot} />
            ))}
          </View>
          <Text style={s.loadingText}>Loading your farm...</Text>
        </View>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6f5" },

  // Background accents
  bgCircleTop: {
    position: "absolute", top: -120, right: -80,
    width: 320, height: 320, borderRadius: 160,
    backgroundColor: "#e8f5e9", opacity: 0.8,
  },
  bgCircleBottom: {
    position: "absolute", bottom: -100, left: -60,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: "#e8f5e9", opacity: 0.6,
  },

  // Center content
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },

  logoBox: {
    width: 110, height: 110, borderRadius: 32,
    backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center", marginBottom: 24,
    shadowColor: "#1a3d24", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 10,
    borderWidth: 1, borderColor: "#eeeeee",
  },
  logoImage: { width: 72, height: 72 },

  appName: { fontSize: 36, fontWeight: "900", color: "#141414", letterSpacing: -1, marginBottom: 8 },
  tagline: { fontSize: 14, color: "#7cb87f", fontWeight: "600", marginBottom: 36 },

  featureRow:    { flexDirection: "row", gap: 12 },
  featureItem:   { alignItems: "center", gap: 8 },
  featureIconBox: {
    width: 48, height: 48, borderRadius: 16, backgroundColor: "#fff",
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: "#eeeeee",
  },
  featureLabel: { fontSize: 10, color: "#9e9e9e", fontWeight: "700" },

  // Buttons
  btnSection: { paddingHorizontal: 24, paddingBottom: 48, gap: 12 },

  loginBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#1a3d24", borderRadius: 18, padding: 18,
    shadowColor: "#1a3d24", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 14, elevation: 8,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  registerBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 18, padding: 18,
    borderWidth: 1.5, borderColor: "#c8e6c9",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  registerBtnText: { color: "#4caf50", fontSize: 16, fontWeight: "800" },

  footerText: { textAlign: "center", fontSize: 11, color: "#bdbdbd", fontWeight: "500" },

  // Loading
  loadingSection: { alignItems: "center", paddingBottom: 48, gap: 12 },
  loadingDots: { flexDirection: "row", gap: 6 },
  loadingDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: "#a5d6a7",
  },
  loadingText: { fontSize: 12, color: "#bdbdbd", fontWeight: "600" },
});