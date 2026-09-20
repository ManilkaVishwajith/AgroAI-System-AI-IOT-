import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Clipboard,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiRequest } from "../../src/api";

interface DeviceDoc {
  _id: string;
  deviceId: string;
  name?: string;
  greenHouseLocation?: string;
}

interface DeviceReq {
  _id: string;
  username: string;
  address: string;
  phoneNumber: string;
  userEmail: string;
  status: "pending" | "approved" | "rejected";
  deviceId: string | null;
  deviceEmail: string | null;
  deviceSecret: string | null;
  createdAt: string;
}

// Credentials card
function CredentialsCard({ req }: { req: DeviceReq }) {
  function copy(label: string, value: string) {
    Clipboard.setString(value);
    Alert.alert("Copied", `${label} copied to clipboard`);
  }

  const rows = [
    {
      label: "DEVICE_ID",
      value: req.deviceId!,
      icon: "hardware-chip-outline" as const,
      iconColor: "#34D399",
      bg: "rgba(52, 211, 153, 0.12)",
    },
    {
      label: "USER_EMAIL",
      value: req.deviceEmail!,
      icon: "mail-outline" as const,
      iconColor: "#38BDF8",
      bg: "rgba(56, 189, 248, 0.12)",
    },
    {
      label: "USER_PASSWORD",
      value: req.deviceSecret!,
      icon: "key-outline" as const,
      iconColor: "#A78BFA",
      bg: "rgba(167, 139, 250, 0.12)",
    },
  ];

  return (
    <View style={cr.card}>
      {/* Header */}
      <View style={cr.header}>
        <View style={cr.headerIconBox}>
          <Ionicons name="shield-checkmark" size={18} color="#34D399" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cr.headerTitle}>Device Credentials Ready</Text>
          <Text style={cr.headerSub}>Use these parameters to register your device</Text>
        </View>
      </View>

      {/* Tap-to-copy rows */}
      {rows.map((item) => (
        <TouchableOpacity
          key={item.label}
          style={cr.row}
          onPress={() => copy(item.label, item.value)}
          activeOpacity={0.75}
        >
          <View style={[cr.rowIconBox, { backgroundColor: item.bg }]}>
            <Ionicons name={item.icon} size={16} color={item.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={cr.rowLabel}>{item.label}</Text>
            <Text style={cr.rowValue} numberOfLines={1}>
              {item.value}
            </Text>
          </View>
          <View style={cr.copyChip}>
            <Ionicons name="copy-outline" size={12} color="#94A3B8" />
            <Text style={cr.copyChipText}>copy</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* CTA */}
      <View style={cr.ctaBox}>
        <Text style={cr.ctaText}>
          Add the Device <Text style={cr.ctaHighlight}>{req.deviceId}</Text> using your assigned credentials
        </Text>
        <TouchableOpacity
          style={cr.ctaBtn}
          onPress={() => router.push("/(user)/add-device")}
          activeOpacity={0.88}
        >
          <Text style={cr.ctaBtnText}>Add Device Now</Text>
          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cr = StyleSheet.create({
  card: {
    backgroundColor: "#101D2B",
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  headerSub: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#162334",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  rowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    color: "#64748B",
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 1,
  },
  rowValue: { color: "#FFFFFF", fontSize: 13, fontWeight: "600", marginTop: 2 },
  copyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  copyChipText: { color: "#94A3B8", fontSize: 10, fontWeight: "700" },
  ctaBox: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
    marginTop: 6,
  },
  ctaText: { color: "#CBD5E1", fontSize: 12.5, lineHeight: 18, marginBottom: 12 },
  ctaHighlight: { color: "#34D399", fontWeight: "800" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13.5 },
});

// Request card
function RequestCard({ req }: { req: DeviceReq }) {
  const approved = req.status === "approved";
  const rejected = req.status === "rejected";
  const pending = req.status === "pending";

  const statusColor = approved ? "#34D399" : rejected ? "#F87171" : "#FBBF24";
  const statusBg = approved
    ? "rgba(52, 211, 153, 0.15)"
    : rejected
      ? "rgba(248, 113, 113, 0.15)"
      : "rgba(251, 191, 36, 0.15)";
  const statusBorder = approved
    ? "rgba(52, 211, 153, 0.3)"
    : rejected
      ? "rgba(248, 113, 113, 0.3)"
      : "rgba(251, 191, 36, 0.3)";
  const statusLabel = approved
    ? "Approved"
    : rejected
      ? "Rejected"
      : "Pending Review";
  const statusIcon = approved
    ? ("checkmark-circle" as const)
    : rejected
      ? ("close-circle" as const)
      : ("time" as const);

  const date = new Date(req.createdAt).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={rq.wrapper}>
      <View style={[rq.card, { borderLeftColor: statusColor }]}>
        {/* Status row */}
        <View style={rq.topRow}>
          <View style={[rq.statusBadge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
            <Ionicons name={statusIcon} size={13} color={statusColor} />
            <Text style={[rq.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          <View style={rq.dateRow}>
            <Ionicons name="calendar-outline" size={11} color="#64748B" />
            <Text style={rq.dateText}>{date}</Text>
          </View>
        </View>

        <View style={rq.divider} />

        {/* Detail rows */}
        {(
          [
            ["Name", req.username, "person-outline"],
            ["Phone", req.phoneNumber, "call-outline"],
            ["Address", req.address, "location-outline"],
          ] as [string, string, any][]
        ).map(([k, v, icon]) => (
          <View key={k} style={rq.detailRow}>
            <View style={rq.detailLeft}>
              <Ionicons name={icon} size={13} color="#64748B" />
              <Text style={rq.detailKey}>{k}</Text>
            </View>
            <Text style={rq.detailVal} numberOfLines={2}>
              {v}
            </Text>
          </View>
        ))}

        {/* Notes */}
        {pending && (
          <View style={rq.noteBox}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color="#FBBF24"
            />
            <Text style={rq.noteText}>
              Under review — credentials will be auto-generated on approval
            </Text>
          </View>
        )}
        {rejected && (
          <View
            style={[
              rq.noteBox,
              { backgroundColor: "rgba(248, 113, 113, 0.12)", borderColor: "rgba(248, 113, 113, 0.3)" },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={15} color="#F87171" />
            <Text style={[rq.noteText, { color: "#F87171" }]}>
              Request rejected. You may submit a new one.
            </Text>
          </View>
        )}
      </View>

      {approved && req.deviceId && <CredentialsCard req={req} />}
    </View>
  );
}

const rq = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  card: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 11, fontWeight: "800" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { color: "#64748B", fontSize: 11 },
  divider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.06)", marginBottom: 12 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailKey: { color: "#64748B", fontSize: 12, fontWeight: "600" },
  detailVal: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
  },
  noteText: { color: "#FBBF24", fontSize: 11.5, lineHeight: 17, flex: 1, fontWeight: "600" },
});

// Main screen
type Tab = "devices" | "requests";

export default function DevicesScreen() {
  const [tab, setTab] = useState<Tab>("devices");
  const [devices, setDevices] = useState<DeviceDoc[]>([]);
  const [requests, setRequests] = useState<DeviceReq[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tab indicator slide animation
  const indicatorX = useRef(new Animated.Value(0)).current;
  function switchTab(t: Tab) {
    setTab(t);
    Animated.spring(indicatorX, {
      toValue: t === "devices" ? 0 : 1,
      useNativeDriver: false,
      speed: 22,
    }).start();
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [devRes, reqRes] = await Promise.allSettled([
      apiRequest("/devices"),
      apiRequest("/device-requests/my"),
    ]);
    if (devRes.status === "fulfilled" && Array.isArray(devRes.value))
      setDevices(devRes.value);
    if (reqRes.status === "fulfilled" && Array.isArray(reqRes.value))
      setRequests(reqRes.value);
    setLoadingDevices(false);
    setLoadingRequests(false);
    setRefreshing(false);
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAll();
  }, []);

  const hasPending = requests.some((r) => r.status === "pending");
  const approvedCount = requests.filter((r) => r.status === "approved").length;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B131E" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <View style={s.badgePill}>
            <View style={s.badgePulseDot} />
            <Text style={s.badgePillText}>HARDWARE HUB</Text>
          </View>
          <Text style={s.title}>Devices</Text>
          <Text style={s.subtitle}>Manage your connected IoT nodes</Text>
        </View>
        <View style={s.headerBtns}>
          <TouchableOpacity
            style={[
              s.iconBtn,
              s.iconBtnOutline,
              hasPending && s.iconBtnDisabled,
            ]}
            onPress={() =>
              hasPending
                ? Alert.alert(
                    "Pending Request",
                    "Your current request is still under review.",
                  )
                : router.push("/(user)/request-device")
            }
            activeOpacity={0.8}
          >
            <Ionicons name="cube-outline" size={19} color="#34D399" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.iconBtn, s.iconBtnGreen]}
            onPress={() => router.push("/(user)/add-device")}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={s.tabItem}
          onPress={() => switchTab("devices")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="hardware-chip-outline"
            size={15}
            color={tab === "devices" ? "#34D399" : "#64748B"}
          />
          <Text style={[s.tabText, tab === "devices" && s.tabTextActive]}>
            My Devices
          </Text>
          {devices.length > 0 && (
            <View
              style={[
                s.tabBadge,
                { backgroundColor: tab === "devices" ? "#10B981" : "rgba(255, 255, 255, 0.08)" },
              ]}
            >
              <Text
                style={[
                  s.tabBadgeText,
                  { color: tab === "devices" ? "#FFFFFF" : "#94A3B8" },
                ]}
              >
                {devices.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.tabItem}
          onPress={() => switchTab("requests")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cube-outline"
            size={15}
            color={tab === "requests" ? "#34D399" : "#64748B"}
          />
          <Text style={[s.tabText, tab === "requests" && s.tabTextActive]}>
            Requests
          </Text>
          {approvedCount > 0 && (
            <View
              style={[
                s.tabBadge,
                { backgroundColor: tab === "requests" ? "#10B981" : "rgba(52, 211, 153, 0.15)" },
              ]}
            >
              <Ionicons
                name="key"
                size={10}
                color={tab === "requests" ? "#FFFFFF" : "#34D399"}
              />
            </View>
          )}
          {pendingCount > 0 && approvedCount === 0 && (
            <View
              style={[
                s.tabBadge,
                { backgroundColor: tab === "requests" ? "#F59E0B" : "rgba(251, 191, 36, 0.15)" },
              ]}
            >
              <Text
                style={[
                  s.tabBadgeText,
                  { color: tab === "requests" ? "#FFFFFF" : "#FBBF24" },
                ]}
              >
                {pendingCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Sliding underline indicator */}
        <Animated.View
          style={[
            s.tabIndicator,
            {
              left: indicatorX.interpolate({
                inputRange: [0, 1],
                outputRange: ["5%", "55%"],
              }),
            },
          ]}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* DEVICES TAB */}
        {tab === "devices" &&
          (loadingDevices ? (
            <ActivityIndicator color="#10B981" style={{ marginTop: 48 }} />
          ) : devices.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconBox}>
                <MaterialCommunityIcons
                  name="antenna"
                  size={38}
                  color="#10B981"
                />
              </View>
              <Text style={s.emptyTitle}>No devices linked</Text>
              <Text style={s.emptySub}>
                Pair an active sensor hardware ID or submit a request for an AgriX kit
              </Text>
              <View style={s.emptyBtnRow}>
                <TouchableOpacity
                  style={s.primaryBtn}
                  onPress={() => router.push("/(user)/add-device")}
                  activeOpacity={0.88}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={s.primaryBtnText}>Add Device</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.secondaryBtn}
                  onPress={() => router.push("/(user)/request-device")}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cube-outline" size={16} color="#34D399" />
                  <Text style={s.secondaryBtnText}>Request One</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={s.countLabel}>
                {devices.length} sensor node{devices.length !== 1 ? "s" : ""} connected
              </Text>
              {devices.map((d) => (
                <TouchableOpacity
                  key={d._id}
                  style={s.deviceCard}
                  onPress={() =>
                    router.push(`/(user)/device/${d.deviceId}` as any)
                  }
                  activeOpacity={0.8}
                >
                  <View style={s.deviceIconBox}>
                    <MaterialCommunityIcons
                      name="antenna"
                      size={20}
                      color="#34D399"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.deviceName}>{d.name ?? d.deviceId}</Text>
                    <Text style={s.deviceIdText}>ID: {d.deviceId}</Text>
                    {d.greenHouseLocation ? (
                      <View style={s.deviceLocRow}>
                        <Ionicons
                          name="location-outline"
                          size={11}
                          color="#64748B"
                        />
                        <Text style={s.deviceLocText}>
                          {d.greenHouseLocation}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={s.deviceCardRight}>
                    <View style={s.onlinePill}>
                      <View style={s.onlineDot} />
                      <Text style={s.onlinePillText}>Live</Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color="#64748B"
                    />
                  </View>
                </TouchableOpacity>
              ))}

              {/* Request another CTA */}
              <TouchableOpacity
                style={s.ctaBanner}
                onPress={() =>
                  hasPending
                    ? Alert.alert(
                        "Pending Request",
                        "Please wait for your current request to be reviewed.",
                      )
                    : router.push("/(user)/request-device")
                }
                activeOpacity={0.85}
              >
                <View style={s.ctaBannerIcon}>
                  <Ionicons name="cube-outline" size={20} color="#34D399" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.ctaBannerTitle}>Need another device?</Text>
                  <Text style={s.ctaBannerSub}>
                    Request an additional AgriX wireless sensor kit
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#34D399" />
              </TouchableOpacity>
            </>
          ))}

        {/* REQUESTS TAB */}
        {tab === "requests" &&
          (loadingRequests ? (
            <ActivityIndicator color="#10B981" style={{ marginTop: 48 }} />
          ) : requests.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconBox}>
                <Ionicons name="cube-outline" size={38} color="#10B981" />
              </View>
              <Text style={s.emptyTitle}>No requests yet</Text>
              <Text style={s.emptySub}>
                Request an AgriX device kit — credentials are automatically assigned upon approval
              </Text>
              <TouchableOpacity
                style={s.primaryBtn}
                onPress={() => router.push("/(user)/request-device")}
                activeOpacity={0.88}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={s.primaryBtnText}>Request a Device</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.countLabel}>
                {requests.length} order request{requests.length !== 1 ? "s" : ""}
              </Text>
              {requests.map((req) => (
                <RequestCard key={req._id} req={req} />
              ))}

              {!hasPending && (
                <TouchableOpacity
                  style={s.newReqBtn}
                  onPress={() => router.push("/(user)/request-device")}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color="#34D399"
                  />
                  <Text style={s.newReqBtnText}>Submit New Request</Text>
                </TouchableOpacity>
              )}

              {hasPending && (
                <View style={s.pendingBanner}>
                  <Ionicons name="time-outline" size={16} color="#FBBF24" />
                  <Text style={s.pendingBannerText}>
                    A request is currently under review. You can submit another once resolved.
                  </Text>
                </View>
              )}
            </>
          ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B131E" },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 16,
    backgroundColor: "#0B131E",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
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
  subtitle: { fontSize: 12.5, color: "#94A3B8", marginTop: 2, fontWeight: "600" },
  headerBtns: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnGreen: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBtnOutline: {
    backgroundColor: "#111C2A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  iconBtnDisabled: { opacity: 0.35 },

  // Tab bar
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 14,
    backgroundColor: "#111C2A",
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    position: "relative",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 1,
  },
  tabText: { fontSize: 12.5, fontWeight: "700", color: "#64748B" },
  tabTextActive: { color: "#FFFFFF", fontWeight: "800" },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tabBadgeText: { fontSize: 9.5, fontWeight: "800" },
  tabIndicator: {
    position: "absolute",
    bottom: 4,
    height: 2.5,
    width: "40%",
    backgroundColor: "#34D399",
    borderRadius: 2,
  },

  // Scroll
  scroll: { paddingHorizontal: 16 },
  countLabel: {
    color: "#64748B",
    fontSize: 11.5,
    fontWeight: "700",
    marginBottom: 10,
    letterSpacing: 0.2,
  },

  // Device card
  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111C2A",
    borderRadius: 16,
    padding: 13,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  deviceIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(52, 211, 153, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deviceName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 1,
  },
  deviceIdText: { color: "#64748B", fontSize: 10.5, marginBottom: 2 },
  deviceLocRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  deviceLocText: { color: "#94A3B8", fontSize: 10.5 },
  deviceCardRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#34D399",
  },
  onlinePillText: { color: "#34D399", fontSize: 10, fontWeight: "800" },

  // CTA banner
  ctaBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#101D2B",
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  ctaBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaBannerTitle: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  ctaBannerSub: { color: "#94A3B8", fontSize: 11 },

  // Empty state
  emptyState: {
    alignItems: "center",
    backgroundColor: "#111C2A",
    borderRadius: 20,
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginTop: 10,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emptySub: {
    color: "#94A3B8",
    fontSize: 12.5,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBtnRow: { flexDirection: "row", gap: 8 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  secondaryBtn: {
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
  secondaryBtnText: { color: "#34D399", fontWeight: "800", fontSize: 13 },

  // New request / pending banner
  newReqBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111C2A",
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    marginTop: 6,
  },
  newReqBtnText: { color: "#34D399", fontSize: 13.5, fontWeight: "800" },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(251, 191, 36, 0.12)",
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
  },
  pendingBannerText: {
    color: "#FBBF24",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    fontWeight: "600",
  },
});