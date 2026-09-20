import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getMyDeviceRequests,
  getMyPredictions,
  getUserDevices,
} from "../../src/api";
import { Device, DeviceRequest, Prediction } from "../../src/types";
import { getUser } from "../../src/utils/storage";

const { width } = Dimensions.get("window");

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: "Good night", icon: "moon-outline" as const };
  if (h < 12) return { text: "Good morning", icon: "sunny-outline" as const };
  if (h < 17) return { text: "Good afternoon", icon: "partly-sunny-outline" as const };
  return { text: "Good evening", icon: "leaf-outline" as const };
}

function FadeSlideIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translateY]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

const TIPS = [
  { icon: "water-outline" as const, color: "#38BDF8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.3)", title: "Watering tip", body: "Water plants in the early morning to reduce evaporation and prevent leaf fungus." },
  { icon: "leaf-outline" as const, color: "#34D399", bg: "rgba(52, 211, 153, 0.15)", border: "rgba(52, 211, 153, 0.3)", title: "Soil health", body: "Test your soil pH every season. Most crops thrive between 6.0–7.0 pH." },
  { icon: "sunny-outline" as const, color: "#FBBF24", bg: "rgba(251, 191, 36, 0.15)", border: "rgba(251, 191, 36, 0.3)", title: "Sunlight guide", body: "Most vegetables need 6–8 hours of full sun daily for optimal growth." },
  { icon: "flask-outline" as const, color: "#A78BFA", bg: "rgba(167, 139, 250, 0.15)", border: "rgba(167, 139, 250, 0.3)", title: "Disease detection", body: "Use the AI Scan regularly — early detection of disease can save your entire crop." },
  { icon: "thermometer-outline" as const, color: "#F87171", bg: "rgba(248, 113, 113, 0.15)", border: "rgba(248, 113, 113, 0.3)", title: "Temperature watch", body: "ESP32 sensors help you track canopy temperature — heat stress starts above 35°C." },
  { icon: "analytics-outline" as const, color: "#2DD4BF", bg: "rgba(45, 212, 191, 0.15)", border: "rgba(45, 212, 191, 0.3)", title: "Sensor data", body: "Review humidity & soil moisture trends weekly to optimize your irrigation schedule." },
  { icon: "bug-outline" as const, color: "#FB923C", bg: "rgba(251, 146, 60, 0.15)", border: "rgba(251, 146, 60, 0.3)", title: "Pest prevention", body: "Yellow sticky traps near plants help monitor and reduce whitefly and aphid populations." },
  { icon: "nutrition-outline" as const, color: "#A3E635", bg: "rgba(163, 230, 53, 0.15)", border: "rgba(163, 230, 53, 0.3)", title: "Fertilizer timing", body: "Apply nitrogen-rich fertilizer during vegetative growth, switch to phosphorus before fruiting." },
];

function getDailyTipIndex() {
  const now = new Date();
  const day = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  return day % TIPS.length;
}

function TipCard() {
  const [tipIdx, setTipIdx] = useState(getDailyTipIndex());
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function nextTip() {
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      setTipIdx((i) => (i + 1) % TIPS.length);
      Animated.timing(fadeAnim, { toValue: 1, duration: 140, useNativeDriver: true }).start();
    });
  }

  const tip = TIPS[tipIdx];

  return (
    <View style={tc.container}>
      <View style={tc.accentLine} />
      <View style={tc.headerRow}>
        <View style={tc.badgeTag}>
          <View style={[tc.iconCircle, { backgroundColor: tip.bg }]}>
            <Ionicons name={tip.icon} size={15} color={tip.color} />
          </View>
          <View>
            <Text style={tc.sectionEyebrow}>FARMING TIP</Text>
            <Text style={[tc.title, { color: tip.color }]}>{tip.title}</Text>
          </View>
        </View>
        <TouchableOpacity style={tc.nextBtn} onPress={nextTip} activeOpacity={0.7}>
          <Ionicons name="refresh-outline" size={15} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      <Animated.Text style={[tc.body, { opacity: fadeAnim }]}>{tip.body}</Animated.Text>

      <View style={tc.dots}>
        {TIPS.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
                setTipIdx(i);
                Animated.timing(fadeAnim, { toValue: 1, duration: 140, useNativeDriver: true }).start();
              });
            }}
          >
            <View style={[tc.dot, i === tipIdx && { backgroundColor: tip.color, width: 18 }]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const tc = StyleSheet.create({
  container: {
    backgroundColor: "#111C2A",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
    overflow: "hidden",
  },
  accentLine: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#10B981",
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, paddingLeft: 6 },
  badgeTag: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sectionEyebrow: { fontSize: 9.5, fontWeight: "900", color: "#64748B", letterSpacing: 1 },
  title: { fontSize: 14, fontWeight: "800", marginTop: 1 },
  nextBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: "rgba(255, 255, 255, 0.05)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.08)" },
  body: { fontSize: 12.5, color: "#94A3B8", lineHeight: 18, marginBottom: 10, paddingLeft: 6 },
  dots: { flexDirection: "row", gap: 4, paddingLeft: 6 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: "#1E293B" },
});

export default function HomeScreen() {
  const [user, setUser] = useState<any>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [requests, setRequests] = useState<DeviceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSegment, setActiveSegment] = useState<"overview" | "devices" | "scans">("overview");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const userData = await getUser();
    setUser(userData);
    const [devRes, predRes, reqRes] = await Promise.allSettled([
      getUserDevices(),
      getMyPredictions(),
      getMyDeviceRequests(),
    ]);
    if (devRes.status === "fulfilled" && Array.isArray(devRes.value)) setDevices(devRes.value);
    if (predRes.status === "fulfilled" && Array.isArray(predRes.value)) setPredictions(predRes.value);
    if (reqRes.status === "fulfilled" && Array.isArray(reqRes.value)) setRequests(reqRes.value);
    setLoading(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const pendingReqs = requests.filter((r) => r.status === "pending").length;
  const healthyCount = predictions.filter((p) => p.diseaseName?.toLowerCase().includes("healthy")).length;
  const healthScore = predictions.length > 0 ? Math.round((healthyCount / predictions.length) * 100) : null;

  if (loading) {
    return (
      <View style={s.centerLoading}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  const greeting = getGreeting();
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`;

  return (
    <View style={s.viewport}>
      <StatusBar barStyle="light-content" backgroundColor="#0B131E" />

      {/* ===================================================
          1. TOP SYSTEM BAR
      =================================================== */}
      <View style={s.topSystemBar}>
        <View style={s.systemInfoWrap}>
          <View style={s.liveSyncPill}>
            <View style={s.liveSyncPulse} />
            <Text style={s.liveSyncText}>FARM TELEMETRY ONLINE</Text>
          </View>
          <Text style={s.userGreetingHeader}>
            {greeting.text}, <Text style={s.userGreetingBold}>{user?.firstName || "Farmer"}</Text>
          </Text>
        </View>

        <TouchableOpacity
          style={s.profileTrigger}
          onPress={() => router.push("/(user)/settings")}
          activeOpacity={0.85}
        >
          <Text style={s.profileTriggerInitials}>{initials || "AG"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.contentScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />}
      >
        {/* ===================================================
            REDESIGNED CARD 1: RADAR TELEMETRY COCKPIT HERO
        =================================================== */}
        <FadeSlideIn delay={0}>
          <View style={s.cockpitContainer}>
            <TouchableOpacity
              style={s.cockpitCard}
              onPress={() => router.push("/(user)/devices")}
              activeOpacity={0.92}
            >
              <View style={s.cockpitHeader}>
                <View style={s.cockpitStatusPill}>
                  <View style={s.cockpitDot} />
                  <Text style={s.cockpitStatusText}>
                    {devices.length > 0 ? "LIVE MONITORING" : "GET STARTED"}
                  </Text>
                </View>
                <View style={s.radarChip}>
                  <MaterialCommunityIcons name="satellite-variant" size={12} color="#34D399" />
                  <Text style={s.radarChipText}>SYNCED</Text>
                </View>
              </View>

              <View style={s.cockpitBody}>
                <View style={{ flex: 1 }}>
                  <Text style={s.heroTitle}>Farm Overview</Text>
                  <Text style={s.heroSub}>
                    {devices.length === 0
                      ? "Add your first device to start monitoring"
                      : `${devices.length} sensor${devices.length > 1 ? "s" : ""} streaming live data`}
                  </Text>
                </View>

                {/* Dial Gauge */}
                <View style={s.radialGaugeBox}>
                  <View style={s.radialGaugeRing}>
                    <Text style={s.radialGaugeVal}>{healthScore !== null ? `${healthScore}%` : "100%"}</Text>
                    <Text style={s.radialGaugeLabel}>VITALITY</Text>
                  </View>
                </View>
              </View>

              {/* Status Chips */}
              <View style={s.cockpitChipsRow}>
                {healthScore !== null && (
                  <View style={s.cockpitChip}>
                    <Ionicons
                      name={healthScore >= 70 ? "leaf" : healthScore >= 40 ? "alert-circle-outline" : "warning-outline"}
                      size={12}
                      color={healthScore >= 70 ? "#34D399" : healthScore >= 40 ? "#FBBF24" : "#F87171"}
                    />
                    <Text style={[s.cockpitChipText, { color: healthScore >= 70 ? "#34D399" : healthScore >= 40 ? "#FBBF24" : "#F87171" }]}>
                      Plant health {healthScore}%
                    </Text>
                  </View>
                )}

                {pendingReqs > 0 && (
                  <View style={[s.cockpitChip, s.cockpitChipWarning]}>
                    <Ionicons name="time-outline" size={12} color="#FBBF24" />
                    <Text style={[s.cockpitChipText, { color: "#FBBF24" }]}>
                      {pendingReqs} device request{pendingReqs > 1 ? "s" : ""} pending
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>

            <View style={s.heroArtBox} />
          </View>
        </FadeSlideIn>

        {/* ===================================================
            REDESIGNED CARD 2: HIGH-DENSITY HUD METRIC CAPSULES
        =================================================== */}
        <FadeSlideIn delay={60}>
          <View style={s.hudMatrixRow}>
            {([
              { icon: "hardware-chip-outline" as const, label: "Devices", num: devices.length, path: "/(user)/devices", color: "#34D399", bg: "rgba(52, 211, 153, 0.12)" },
              { icon: "scan-outline" as const, label: "Scans", num: predictions.length, path: "/(user)/ai-scan", color: "#38BDF8", bg: "rgba(56, 189, 248, 0.12)" },
              { icon: "cube-outline" as const, label: "Requests", num: requests.length, path: "/(user)/devices", color: "#A78BFA", bg: "rgba(167, 139, 250, 0.12)" },
            ] as const).map((item) => (
              <TouchableOpacity
                key={item.label}
                style={s.hudCard}
                onPress={() => router.push(item.path as any)}
                activeOpacity={0.82}
              >
                <View style={s.hudCardHeader}>
                  <View style={[s.hudIconBox, { backgroundColor: item.bg }]}>
                    <Ionicons name={item.icon} size={15} color={item.color} />
                  </View>
                  <Text style={s.hudCardLabel}>{item.label}</Text>
                </View>
                <Text style={s.hudCardValue}>{item.num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </FadeSlideIn>

        {/* ===================================================
            3. HORIZONTAL FIELD NODES REEL
        =================================================== */}
        {devices.length > 0 && (
          <FadeSlideIn delay={120}>
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Active Devices</Text>
                <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push("/(user)/devices")}>
                  <Text style={s.viewAllText}>View all</Text>
                  <Ionicons name="arrow-forward" size={13} color="#10B981" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.horizontalStrip}
              >
                {devices.map((d) => (
                  <TouchableOpacity
                    key={d._id}
                    style={s.deviceCard}
                    onPress={() => router.push(`/(user)/device/${d.deviceId}` as any)}
                    activeOpacity={0.85}
                  >
                    <View style={s.deviceCardTop}>
                      <View style={s.deviceCardIcon}>
                        <MaterialCommunityIcons name="antenna" size={18} color="#34D399" />
                      </View>
                      <View style={s.onlinePill}>
                        <View style={s.onlinePillDot} />
                        <Text style={s.onlinePillText}>Live</Text>
                      </View>
                    </View>

                    <Text style={s.deviceName} numberOfLines={1}>
                      {d.name || d.deviceId}
                    </Text>
                    <Text style={s.deviceSubId}>ID: {d.deviceId}</Text>

                    {d.greenHouseLocation ? (
                      <View style={s.deviceLocRow}>
                        <Ionicons name="location-outline" size={11} color="#64748B" />
                        <Text style={s.deviceLocText} numberOfLines={1}>
                          {d.greenHouseLocation}
                        </Text>
                      </View>
                    ) : null}

                    <View style={s.deviceCardRight} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </FadeSlideIn>
        )}

        {/* ===================================================
            4. VISUAL AI SCAN REEL
        =================================================== */}
        {predictions.length > 0 && (
          <FadeSlideIn delay={180}>
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <Text style={s.sectionTitle}>Recent Scans</Text>
                <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push("/(user)/ai-scan")}>
                  <Text style={s.viewAllText}>View all</Text>
                  <Ionicons name="arrow-forward" size={13} color="#10B981" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.horizontalStrip}
              >
                {predictions.map((p) => {
                  const pct = Math.round(p.confidence * 100);
                  const healthy = p.diseaseName?.toLowerCase().includes("healthy");
                  const txtColor = healthy ? "#34D399" : pct >= 75 ? "#F87171" : "#FB923C";
                  const bgColor = healthy ? "rgba(52, 211, 153, 0.15)" : pct >= 75 ? "rgba(248, 113, 113, 0.15)" : "rgba(251, 146, 60, 0.15)";
                  const bdColor = healthy ? "rgba(52, 211, 153, 0.3)" : pct >= 75 ? "rgba(248, 113, 113, 0.3)" : "rgba(251, 146, 60, 0.3)";

                  return (
                    <View key={p._id} style={s.scanCard}>
                      <Image source={{ uri: p.imageUrl }} style={s.scanThumb} />
                      <View style={s.scanDetailsWrap}>
                        <Text style={s.scanName} numberOfLines={1}>
                          {p.diseaseName}
                        </Text>
                        <View style={s.scanDateRow}>
                          <Ionicons name="calendar-outline" size={10} color="#64748B" />
                          <Text style={s.scanDate}>
                            {new Date(p.predictedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </Text>
                        </View>
                      </View>

                      <View style={[s.confidenceBadge, { backgroundColor: bgColor, borderColor: bdColor }]}>
                        <Text style={[s.confidenceText, { color: txtColor }]}>{pct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </FadeSlideIn>
        )}

        {/* ===================================================
            5. DAILY AGRONOMY ADVISORY CARD
        =================================================== */}
        <FadeSlideIn delay={240}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionTitle}>Today's Tip</Text>
            <View style={s.dailyBadge}>
              <Ionicons name="calendar-outline" size={11} color="#34D399" />
              <Text style={s.dailyBadgeText}>Daily</Text>
            </View>
          </View>
          <TipCard />
        </FadeSlideIn>

        {/* ===================================================
            6. ONBOARDING EMPTY STATE
        =================================================== */}
        {devices.length === 0 && predictions.length === 0 && (
          <FadeSlideIn delay={120}>
            <View style={s.emptyCard}>
              <View style={s.emptyIconBox}>
                <MaterialCommunityIcons name="sprout" size={44} color="#10B981" />
              </View>
              <Text style={s.emptyTitle}>Welcome to AgriX!</Text>
              <Text style={s.emptySub}>
                Connect your first sensor or scan a plant leaf to start smart farming.
              </Text>
              <View style={s.emptyBtnRow}>
                <TouchableOpacity
                  style={s.emptyPrimaryBtn}
                  onPress={() => router.push("/(user)/devices")}
                  activeOpacity={0.88}
                >
                  <Ionicons name="hardware-chip-outline" size={16} color="#FFFFFF" />
                  <Text style={s.emptyPrimaryBtnText}>Add Device</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.emptySecondaryBtn}
                  onPress={() => router.push("/(user)/ai-scan")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="scan-outline" size={16} color="#34D399" />
                  <Text style={s.emptySecondaryBtnText}>Scan Plant</Text>
                </TouchableOpacity>
              </View>
            </View>
          </FadeSlideIn>
        )}
      </ScrollView>

      {/* ===================================================
          7. FLOATING TACTICAL COMMAND DOCK
      =================================================== */}
      <View style={s.floatingActionDock}>
        <TouchableOpacity
          style={s.primaryDockBtn}
          onPress={() => router.push("/(user)/ai-scan")}
          activeOpacity={0.88}
        >
          <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
          <Text style={s.primaryDockBtnText}>Run AI Vision Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.secondaryDockBtn}
          onPress={() => router.push("/(user)/devices")}
          activeOpacity={0.85}
        >
          <Ionicons name="hardware-chip-outline" size={18} color="#34D399" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* =========================================
   STYLES
========================================= */

const s = StyleSheet.create({
  viewport: {
    flex: 1,
    backgroundColor: "#0B131E",
  },
  contentScroll: {
    flex: 1,
  },
  centerLoading: {
    flex: 1,
    backgroundColor: "#0B131E",
    alignItems: "center",
    justifyContent: "center",
  },

  /* 1. Top System Bar */
  topSystemBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 14,
    backgroundColor: "#0B131E",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  systemInfoWrap: {
    flex: 1,
  },
  liveSyncPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 2,
  },
  liveSyncPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  liveSyncText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#34D399",
    letterSpacing: 0.8,
  },
  userGreetingHeader: {
    fontSize: 18,
    color: "#94A3B8",
  },
  userGreetingBold: {
    fontWeight: "900",
    color: "#FFFFFF",
  },
  profileTrigger: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#162334",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileTriggerInitials: {
    color: "#34D399",
    fontSize: 14,
    fontWeight: "800",
  },

  /* NEW: Card 1 Cockpit Hero */
  cockpitContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    marginBottom: 12,
  },
  cockpitCard: {
    backgroundColor: "#101D2B",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cockpitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cockpitStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  cockpitDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#34D399",
  },
  cockpitStatusText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#34D399",
    letterSpacing: 0.8,
  },
  radarChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  radarChipText: {
    color: "#94A3B8",
    fontSize: 8.5,
    fontWeight: "800",
  },
  cockpitBody: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  heroSub: {
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 16,
  },
  radialGaugeBox: {
    marginLeft: 10,
  },
  radialGaugeRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderWidth: 2,
    borderColor: "#34D399",
    alignItems: "center",
    justifyContent: "center",
  },
  radialGaugeVal: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },
  radialGaugeLabel: {
    color: "#34D399",
    fontSize: 7,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  cockpitChipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  cockpitChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cockpitChipWarning: {
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    borderColor: "rgba(251, 191, 36, 0.3)",
  },
  cockpitChipText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  heroArtBox: { display: "none" },

  /* NEW: Card 2 HUD Matrix Capsules */
  hudMatrixRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  hudCard: {
    flex: 1,
    backgroundColor: "#111C2A",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
  },
  hudCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  hudIconBox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  hudCardLabel: {
    fontSize: 10.5,
    fontWeight: "800",
    color: "#94A3B8",
  },
  hudCardValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
  },

  /* 3. Sections & Horizontal Reels */
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#34D399",
  },
  horizontalStrip: {
    paddingHorizontal: 16,
    gap: 10,
  },

  /* Device Card Reel */
  deviceCard: {
    width: 170,
    backgroundColor: "#111C2A",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  deviceCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  deviceCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  deviceSubId: {
    fontSize: 10,
    color: "#64748B",
    marginBottom: 6,
  },
  deviceLocRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  deviceLocText: {
    fontSize: 10,
    color: "#94A3B8",
    flex: 1,
  },
  deviceCardRight: { display: "none" },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onlinePillDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#34D399",
  },
  onlinePillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#34D399",
  },

  /* Scan Card Reel */
  scanCard: {
    width: 160,
    backgroundColor: "#111C2A",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  scanThumb: {
    width: "100%",
    height: 100,
    borderRadius: 10,
    backgroundColor: "#1E293B",
    marginBottom: 8,
  },
  scanDetailsWrap: {
    marginBottom: 6,
  },
  scanName: {
    fontSize: 12.5,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  scanDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  scanDate: {
    fontSize: 10,
    color: "#64748B",
  },
  confidenceBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
    borderWidth: 1,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: "900",
  },

  /* 4. Daily Tip Header */
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  dailyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dailyBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    color: "#34D399",
  },

  /* 5. Empty State */
  emptyCard: {
    marginHorizontal: 16,
    alignItems: "center",
    backgroundColor: "#111C2A",
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBtnRow: {
    flexDirection: "row",
    gap: 8,
  },
  emptyPrimaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyPrimaryBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12.5,
  },
  emptySecondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#162334",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  emptySecondaryBtnText: {
    color: "#34D399",
    fontWeight: "800",
    fontSize: 12.5,
  },

  /* 6. Floating Action Dock */
  floatingActionDock: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 10,
  },
  primaryDockBtn: {
    flex: 1,
    height: 52,
    backgroundColor: "#10B981",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryDockBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryDockBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#111C2A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
});