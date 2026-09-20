import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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
import { apiRequest } from "../../src/api";

type RequestStatus = "pending" | "approved" | "rejected";
type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface ExistingRequest {
  _id: string;
  status: RequestStatus;
  username: string;
  address: string;
  phoneNumber: string;
  createdAt: string;
}

// ── Existing request screen (pending / approved / rejected) ───────────────────
function ExistingRequestScreen({
  req,
  onSubmitNew,
}: {
  req: ExistingRequest;
  onSubmitNew: () => void;
}) {
  const isPending = req.status === "pending";
  const isApproved = req.status === "approved";
  const isRejected = req.status === "rejected";

  const statusColor = isApproved ? "#34D399" : isRejected ? "#F87171" : "#FBBF24";
  const statusBg = isApproved
    ? "rgba(52, 211, 153, 0.12)"
    : isRejected
    ? "rgba(248, 113, 113, 0.12)"
    : "rgba(251, 191, 36, 0.12)";
  const statusBorder = isApproved
    ? "rgba(52, 211, 153, 0.3)"
    : isRejected
    ? "rgba(248, 113, 113, 0.3)"
    : "rgba(251, 191, 36, 0.3)";
  const statusIcon: IoniconsName = isApproved
    ? "checkmark-circle"
    : isRejected
    ? "close-circle"
    : "time";
  const statusLabel = isApproved ? "Approved" : isRejected ? "Rejected" : "Pending Review";

  const date = new Date(req.createdAt).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const steps: { icon: IoniconsName; label: string }[] = [
    { icon: "person-outline", label: "Admin reviews your request" },
    { icon: "key-outline", label: "Device ID, Email & Password are auto-generated" },
    { icon: "hardware-chip-outline", label: "Credentials are programmed to your ESP32 kit" },
    { icon: "cube-outline", label: "Hardware package is shipped to your address" },
    { icon: "list-outline", label: "Open Requests tab to view active credentials" },
    { icon: "add-circle-outline", label: "Pair and add the device in-app using Device ID" },
  ];

  const detailRows: { icon: IoniconsName; key: string; val: string }[] = [
    { icon: "person-outline", key: "Name", val: req.username },
    { icon: "call-outline", key: "Phone", val: req.phoneNumber },
    { icon: "location-outline", key: "Address", val: req.address },
  ];

  return (
    <ScrollView style={ex.container} contentContainerStyle={ex.content} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0B131E" />

      {/* Back Button */}
      <TouchableOpacity style={ex.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <View style={ex.backIconBox}>
          <Ionicons name="arrow-back" size={16} color="#34D399" />
        </View>
        <Text style={ex.backText}>Back</Text>
      </TouchableOpacity>

      {/* Status Hero Badge */}
      <View style={[ex.iconBox, { backgroundColor: statusBg, borderColor: statusBorder }]}>
        <Ionicons name={statusIcon} size={48} color={statusColor} />
      </View>

      <Text style={ex.title}>
        {isApproved ? "Request Approved!" : isRejected ? "Request Rejected" : "Request Submitted!"}
      </Text>
      <Text style={ex.sub}>
        {isApproved
          ? "Your device credentials have been generated. Check the Requests tab to view them and pair your ESP32."
          : isRejected
          ? "Your request could not be processed at this time. You can submit a new request below."
          : "Our team is reviewing your details. Once approved, your device credentials will be assigned automatically."}
      </Text>

      {/* Status Details Card */}
      <View style={[ex.statusCard, { borderLeftColor: statusColor }]}>
        <View style={ex.statusCardRow}>
          <View style={[ex.statusBadge, { backgroundColor: statusBg, borderColor: statusBorder }]}>
            <Ionicons name={statusIcon} size={13} color={statusColor} />
            <Text style={[ex.statusBadgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          <View style={ex.dateRow}>
            <Ionicons name="calendar-outline" size={11} color="#64748B" />
            <Text style={ex.dateText}>{date}</Text>
          </View>
        </View>

        <View style={ex.statusDivider} />

        {detailRows.map((row) => (
          <View key={row.key} style={ex.detailRow}>
            <View style={ex.detailLeft}>
              <Ionicons name={row.icon} size={13} color="#64748B" />
              <Text style={ex.detailKey}>{row.key}</Text>
            </View>
            <Text style={ex.detailVal} numberOfLines={2}>
              {row.val}
            </Text>
          </View>
        ))}
      </View>

      {/* Pending Step Timeline */}
      {isPending && (
        <View style={ex.stepsCard}>
          <View style={ex.stepsHeader}>
            <Ionicons name="git-branch-outline" size={16} color="#34D399" />
            <Text style={ex.stepsTitle}>Fulfillment Pipeline</Text>
          </View>
          {steps.map((step, i) => (
            <View key={i} style={ex.stepRow}>
              <View style={ex.stepNum}>
                <Text style={ex.stepNumText}>{i + 1}</Text>
              </View>
              <View style={ex.stepIconBox}>
                <Ionicons name={step.icon} size={14} color="#34D399" />
              </View>
              <Text style={ex.stepLabel}>{step.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Rejected Notice */}
      {isRejected && (
        <>
          <View style={ex.rejectedBanner}>
            <View style={ex.rejectedBannerIcon}>
              <Ionicons name="information-circle-outline" size={18} color="#F87171" />
            </View>
            <Text style={ex.rejectedBannerText}>
              You can submit a new request. Make sure your shipping and contact information are accurate.
            </Text>
          </View>
          <TouchableOpacity style={ex.primaryBtn} onPress={onSubmitNew} activeOpacity={0.88}>
            <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
            <Text style={ex.primaryBtnText}>Submit New Request</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Approved Actions */}
      {isApproved && (
        <>
          <TouchableOpacity
            style={ex.primaryBtn}
            onPress={() => router.replace("/(user)/devices")}
            activeOpacity={0.88}
          >
            <Ionicons name="list-outline" size={16} color="#FFFFFF" />
            <Text style={ex.primaryBtnText}>View Credentials in Requests Tab</Text>
          </TouchableOpacity>
          <TouchableOpacity style={ex.newReqBtn} onPress={onSubmitNew} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={16} color="#34D399" />
            <Text style={ex.newReqBtnText}>Request Another Device</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Pending Actions */}
      {isPending && (
        <TouchableOpacity
          style={ex.primaryBtn}
          onPress={() => router.replace("/(user)/devices")}
          activeOpacity={0.88}
        >
          <Ionicons name="list-outline" size={16} color="#FFFFFF" />
          <Text style={ex.primaryBtnText}>View My Requests</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={ex.secondaryBtn} onPress={() => router.back()} activeOpacity={0.85}>
        <Ionicons name="arrow-back-outline" size={16} color="#34D399" />
        <Text style={ex.secondaryBtnText}>Back to Devices</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const ex = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B131E" },
  content: { padding: 18, paddingBottom: 60 },

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

  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: "center",
  },
  sub: {
    fontSize: 12.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 12,
  },

  statusCard: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  statusCardRow: {
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
  statusBadgeText: { fontSize: 11, fontWeight: "800" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  dateText: { color: "#64748B", fontSize: 11 },
  statusDivider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.06)", marginBottom: 12 },
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

  stepsCard: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  stepsHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  stepsTitle: { fontSize: 13.5, fontWeight: "800", color: "#FFFFFF" },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepNum: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { fontSize: 9.5, fontWeight: "900", color: "#34D399" },
  stepIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#162334",
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: { flex: 1, fontSize: 12, color: "#CBD5E1", lineHeight: 17 },

  rejectedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.25)",
    marginBottom: 14,
  },
  rejectedBannerIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(248, 113, 113, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rejectedBannerText: { flex: 1, color: "#FCA5A5", fontSize: 12, lineHeight: 17 },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111C2A",
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  secondaryBtnText: { color: "#34D399", fontSize: 13.5, fontWeight: "700" },
  newReqBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111C2A",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  newReqBtnText: { color: "#34D399", fontSize: 13.5, fontWeight: "800" },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function RequestDeviceScreen() {
  const [username, setUsername] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<"checking" | "form" | "existing">("checking");
  const [existingReq, setExistingReq] = useState<ExistingRequest | null>(null);

  useFocusEffect(
    useCallback(() => {
      checkExisting();
    }, [])
  );

  async function checkExisting() {
    setScreen("checking");
    try {
      const res = await apiRequest("/device-requests/my");
      if (Array.isArray(res) && res.length > 0) {
        const pending = res.find((r: ExistingRequest) => r.status === "pending");
        const latest = pending ?? res[0];
        setExistingReq(latest);
        setScreen("existing");
      } else {
        setScreen("form");
      }
    } catch {
      setScreen("form");
    }
  }

  async function handleSubmit() {
    if (!username.trim() || !address.trim() || !phoneNumber.trim()) {
      Alert.alert("Missing Fields", "All fields are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest("/device-requests", "POST", {
        username: username.trim(),
        address: address.trim(),
        phoneNumber: phoneNumber.trim(),
      });
      if (res.message === "Device request submitted successfully") {
        await checkExisting();
      } else {
        Alert.alert("Failed", res.message || "Could not submit request");
      }
    } catch {
      Alert.alert("Error", "Network error. Please try again.");
    }
    setLoading(false);
  }

  // ── Checking State ──────────────────────────────────────────────────────────
  if (screen === "checking") {
    return (
      <View style={s.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0B131E" />
        <View style={s.loadingIconBox}>
          <Ionicons name="cube-outline" size={28} color="#34D399" />
        </View>
        <ActivityIndicator color="#10B981" style={{ marginTop: 16 }} />
        <Text style={s.loadingText}>Checking hardware request status...</Text>
      </View>
    );
  }

  // ── Existing request view ───────────────────────────────────────────────────
  if (screen === "existing" && existingReq) {
    return (
      <ExistingRequestScreen
        req={existingReq}
        onSubmitNew={() => {
          setExistingReq(null);
          setUsername("");
          setAddress("");
          setPhoneNumber("");
          setScreen("form");
        }}
      />
    );
  }

  // ── Form view ───────────────────────────────────────────────────────────────
  const kitItems: { icon: IoniconsName; label: string }[] = [
    { icon: "hardware-chip-outline", label: "ESP32 dual-core microcontroller module" },
    { icon: "thermometer-outline", label: "DHT22 high-accuracy temperature & humidity sensor" },
    { icon: "water-outline", label: "Capacitive corrosion-resistant soil moisture probe" },
    { icon: "tv-outline", label: "OLED local display + 5V power adapter" },
    { icon: "flash-outline", label: "Pre-flashed AgriX telemetry firmware with auto-login" },
  ];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0B131E" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0B131E" />
      <ScrollView contentContainerStyle={s.container} showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <View style={s.backIconBox}>
            <Ionicons name="arrow-back" size={16} color="#34D399" />
          </View>
          <Text style={s.backText}>Back</Text>
        </TouchableOpacity>

        {/* Title Header */}
        <View style={s.badgePill}>
          <View style={s.badgePulseDot} />
          <Text style={s.badgePillText}>HARDWARE ACQUISITION</Text>
        </View>
        <Text style={s.title}>Request a Device</Text>
        <Text style={s.subtitle}>
          Fill in your details — Device ID, Email & Password will be auto-generated after approval
        </Text>

        {/* Included Hardware Specification Card */}
        <View style={s.includedCard}>
          <View style={s.includedHeader}>
            <View style={s.includedIconBox}>
              <Ionicons name="cube" size={16} color="#34D399" />
            </View>
            <Text style={s.includedTitle}>What's included in the kit</Text>
          </View>
          {kitItems.map((item, i) => (
            <View key={i} style={s.includedRow}>
              <View style={s.includedRowIcon}>
                <Ionicons name={item.icon} size={13} color="#34D399" />
              </View>
              <Text style={s.includedRowText}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Informational Security Notice */}
        <View style={s.noticeBanner}>
          <View style={s.noticeIconBox}>
            <Ionicons name="shield-checkmark" size={18} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.noticeTitle}>Zero Manual Setup Required</Text>
            <Text style={s.noticeText}>
              Your network credentials and security keys are created directly during admin provisioning and flashed onto the hardware.
            </Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>YOUR CONTACT & SHIPPING DETAILS</Text>

        {/* Form Container */}
        <View style={s.card}>
          <View style={s.group}>
            <Text style={s.label}>
              FULL NAME <Text style={s.req}>*</Text>
            </Text>
            <View style={s.inputRow}>
              <View style={[s.inputIconBox, { backgroundColor: "rgba(52, 211, 153, 0.12)" }]}>
                <Ionicons name="person-outline" size={15} color="#34D399" />
              </View>
              <TextInput
                style={s.inputField}
                placeholder="Shehan Manilka"
                placeholderTextColor="#64748B"
                value={username}
                onChangeText={setUsername}
              />
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.group}>
            <Text style={s.label}>
              PHONE NUMBER <Text style={s.req}>*</Text>
            </Text>
            <View style={s.inputRow}>
              <View style={[s.inputIconBox, { backgroundColor: "rgba(56, 189, 248, 0.12)" }]}>
                <Ionicons name="call-outline" size={15} color="#38BDF8" />
              </View>
              <TextInput
                style={s.inputField}
                placeholder="+94 77 123 4567"
                placeholderTextColor="#64748B"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={s.divider} />

          <View style={s.group}>
            <Text style={s.label}>
              DELIVERY ADDRESS <Text style={s.req}>*</Text>
            </Text>
            <View style={[s.inputRow, { alignItems: "flex-start", paddingTop: 10 }]}>
              <View style={[s.inputIconBox, { backgroundColor: "rgba(248, 113, 113, 0.12)", marginTop: 2 }]}>
                <Ionicons name="location-outline" size={15} color="#F87171" />
              </View>
              <TextInput
                style={[s.inputField, { height: 72, textAlignVertical: "top" }]}
                placeholder={"No. 12, Main Street\nColombo 03"}
                placeholderTextColor="#64748B"
                value={address}
                onChangeText={setAddress}
                multiline
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[s.submitBtn, loading && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="send" size={16} color="#FFFFFF" />
              <Text style={s.submitBtnText}>Submit Device Request</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0B131E",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingIconBox: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  loadingText: { fontSize: 13, color: "#94A3B8", marginTop: 4, fontWeight: "600" },

  container: { padding: 18, paddingBottom: 60 },

  /* Back button */
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

  /* Header */
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
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 18,
  },

  /* Included Box */
  includedCard: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 10,
  },
  includedHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 },
  includedIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  includedTitle: { fontSize: 13.5, fontWeight: "800", color: "#FFFFFF" },
  includedRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  includedRowIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "rgba(52, 211, 153, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  includedRowText: { flex: 1, fontSize: 12, color: "#CBD5E1", lineHeight: 16 },

  /* Notice Banner */
  noticeBanner: {
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
  noticeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(56, 189, 248, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  noticeTitle: { fontSize: 12.5, fontWeight: "800", color: "#FFFFFF", marginBottom: 2 },
  noticeText: { fontSize: 11.5, color: "#93C5FD", lineHeight: 16 },

  sectionLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1.2,
    marginBottom: 8,
  },

  /* Card & Inputs */
  card: {
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 18,
  },
  divider: { height: 1, backgroundColor: "rgba(255, 255, 255, 0.05)" },
  group: { gap: 6 },
  label: { fontSize: 9.5, fontWeight: "800", color: "#64748B", letterSpacing: 1 },
  req: { color: "#F87171" },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#162334",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    paddingLeft: 10,
    paddingRight: 10,
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

  /* Submit Button */
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.5, shadowOpacity: 0 },
  submitBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});