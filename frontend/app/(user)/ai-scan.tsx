import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getMyPredictions, predictDisease } from "../../src/api";
import { uploadImageToSupabase } from "../../src/api/supabase";

type Step =
  | "idle"
  | "picked"
  | "uploading"
  | "uploaded"
  | "analyzing"
  | "done"
  | "error";

interface Prediction {
  _id: string;
  imageUrl: string;
  diseaseName: string;
  description: string;
  solution: string;
  confidence: number;
  predictedAt: string;
}

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// Step Progress
function StepProgress({ step }: { step: Step }) {
  const steps: { key: string; label: string; icon: IoniconsName }[] = [
    { key: "picked", label: "Photo", icon: "camera-outline" },
    { key: "uploaded", label: "Upload", icon: "cloud-upload-outline" },
    { key: "done", label: "Result", icon: "flask-outline" },
  ];
  const activeIndex =
    step === "idle"
      ? -1
      : step === "picked" || step === "uploading"
      ? 0
      : step === "uploaded" || step === "analyzing"
      ? 1
      : step === "done"
      ? 2
      : 0;

  const isLoading = (i: number) =>
    (i === 0 && step === "uploading") || (i === 1 && step === "analyzing");

  if (step === "idle") return null;

  return (
    <View style={sp.wrap}>
      {steps.map((s, i) => {
        const done = activeIndex > i;
        const active = activeIndex === i;
        const loading = isLoading(i);
        return (
          <View key={s.key} style={sp.stepRow}>
            <View style={sp.stepItem}>
              <View
                style={[
                  sp.circle,
                  done && sp.circleDone,
                  active && sp.circleActive,
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#34D399" />
                ) : done ? (
                  <Ionicons name="checkmark" size={16} color="#34D399" />
                ) : (
                  <Ionicons
                    name={s.icon}
                    size={16}
                    color={active ? "#34D399" : "#64748B"}
                  />
                )}
              </View>
              <Text style={[sp.label, (done || active) && sp.labelActive]}>
                {s.label}
              </Text>
            </View>
            {i < steps.length - 1 && (
              <View style={[sp.line, done && sp.lineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const sp = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#111C2A",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  stepRow: { flexDirection: "row", alignItems: "center" },
  stepItem: { alignItems: "center", width: 64 },
  circle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#162334",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  circleDone: { backgroundColor: "rgba(16, 185, 129, 0.15)", borderColor: "#10B981" },
  circleActive: { backgroundColor: "rgba(52, 211, 153, 0.15)", borderColor: "#34D399" },
  label: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  labelActive: { color: "#34D399" },
  line: {
    width: 24,
    height: 2,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 20,
    marginHorizontal: 2,
  },
  lineDone: { backgroundColor: "#10B981" },
});

// Status Message
function StatusMessage({ step }: { step: Step }) {
  const map: Partial<
    Record<
      Step,
      { text: string; sub: string; color: string; bg: string; border: string }
    >
  > = {
    uploading: {
      text: "Uploading leaf imagery...",
      sub: "Storing encrypted scan to cloud bucket",
      color: "#38BDF8",
      bg: "rgba(56, 189, 248, 0.12)",
      border: "rgba(56, 189, 248, 0.3)",
    },
    analyzing: {
      text: "AI Neural Model Analyzing...",
      sub: "Identifying plant pathology signatures",
      color: "#FBBF24",
      bg: "rgba(251, 191, 36, 0.12)",
      border: "rgba(251, 191, 36, 0.3)",
    },
    error: {
      text: "Diagnosis Interrupted",
      sub: "Unable to process leaf scan. Please retry.",
      color: "#F87171",
      bg: "rgba(248, 113, 113, 0.12)",
      border: "rgba(248, 113, 113, 0.3)",
    },
  };
  const msg = map[step];
  if (!msg) return null;
  return (
    <View style={[sm.wrap, { backgroundColor: msg.bg, borderColor: msg.border }]}>
      <ActivityIndicator color={msg.color} size="small" style={{ marginRight: 10 }} />
      <View>
        <Text style={[sm.text, { color: msg.color }]}>{msg.text}</Text>
        <Text style={sm.sub}>{msg.sub}</Text>
      </View>
    </View>
  );
}

const sm = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  text: { fontSize: 13.5, fontWeight: "800" },
  sub: { fontSize: 11, color: "#94A3B8", marginTop: 2 },
});

// Confidence Badge
function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "#34D399" : pct >= 55 ? "#FBBF24" : "#F87171";
  const bg =
    pct >= 80
      ? "rgba(52, 211, 153, 0.15)"
      : pct >= 55
      ? "rgba(251, 191, 36, 0.15)"
      : "rgba(248, 113, 113, 0.15)";
  return (
    <View style={[cb.wrap, { backgroundColor: bg, borderColor: color + "40" }]}>
      <Text style={[cb.pct, { color }]}>{pct}%</Text>
      <Text style={[cb.label, { color: color }]}>CONFIDENCE</Text>
    </View>
  );
}

const cb = StyleSheet.create({
  wrap: {
    borderWidth: 1.2,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: "center",
  },
  pct: { fontSize: 20, fontWeight: "900", letterSpacing: -0.5 },
  label: { fontSize: 8.5, fontWeight: "800", letterSpacing: 0.8, marginTop: 1 },
});

// Result Modal
function ResultModal({
  result,
  onClose,
}: {
  result: Prediction | null;
  onClose: () => void;
}) {
  const slideAnim = useRef(new Animated.Value(400)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (result) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 55,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(400);
      opacityAnim.setValue(0);
    }
  }, [result]);

  if (!result) return null;

  const pct = Math.round(result.confidence * 100);
  const isHealthy = result.diseaseName.toLowerCase().includes("healthy");
  const accent = isHealthy ? "#34D399" : pct >= 75 ? "#F87171" : "#FB923C";
  const accentBg = isHealthy
    ? "rgba(52, 211, 153, 0.12)"
    : pct >= 75
    ? "rgba(248, 113, 113, 0.12)"
    : "rgba(251, 146, 60, 0.12)";

  return (
    <Modal visible={!!result} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[rm.overlay, { opacity: opacityAnim }]}>
        <Animated.ScrollView
          style={[rm.sheet, { transform: [{ translateY: slideAnim }] }]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={rm.handle} />
          <Image source={{ uri: result.imageUrl }} style={rm.image} resizeMode="cover" />

          <View style={rm.topRow}>
            <View style={{ flex: 1 }}>
              <Text style={rm.detectedLabel}>DIAGNOSTIC VERDICT</Text>
              <Text style={[rm.diseaseName, { color: accent }]} numberOfLines={2}>
                {result.diseaseName}
              </Text>
            </View>
            <ConfidenceBadge value={result.confidence} />
          </View>

          <View
            style={[
              rm.severityBar,
              { backgroundColor: accentBg, borderColor: accent + "33" },
            ]}
          >
            <View style={[rm.severityIconBox, { backgroundColor: accent + "22" }]}>
              <Ionicons
                name={isHealthy ? "leaf" : pct >= 75 ? "warning" : "alert-circle"}
                size={18}
                color={accent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[rm.severityTitle, { color: accent }]}>
                {isHealthy
                  ? "Plant is healthy"
                  : pct >= 75
                  ? "High Severity Detected"
                  : "Moderate Severity"}
              </Text>
              <Text style={rm.severitySub}>
                {isHealthy
                  ? "No pathogen found — continue routine monitoring"
                  : pct >= 75
                  ? "Immediate treatment action recommended"
                  : "Monitor closely and inspect nearby foliage"}
              </Text>
            </View>
          </View>

          {result.description ? (
            <View style={rm.section}>
              <View style={rm.sectionTitleRow}>
                <Ionicons name="document-text-outline" size={14} color="#64748B" />
                <Text style={rm.sectionTitle}>About this Condition</Text>
              </View>
              <Text style={rm.sectionBody}>{result.description}</Text>
            </View>
          ) : null}

          {result.solution ? (
            <View style={[rm.section, rm.solutionBox]}>
              <View style={rm.sectionTitleRow}>
                <Ionicons name="medkit-outline" size={14} color="#34D399" />
                <Text style={[rm.sectionTitle, { color: "#34D399" }]}>
                  Recommended Agronomic Action
                </Text>
              </View>
              <Text style={rm.solutionBody}>{result.solution}</Text>
            </View>
          ) : null}

          <View style={rm.meta}>
            <Ionicons name="calendar-outline" size={12} color="#64748B" />
            <Text style={rm.metaText}>
              {new Date(result.predictedAt).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(result.predictedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>

          <TouchableOpacity style={rm.closeBtn} onPress={onClose} activeOpacity={0.88}>
            <Text style={rm.closeBtnText}>Done</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </Animated.ScrollView>
      </Animated.View>
    </Modal>
  );
}

const rm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111C2A",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    maxHeight: "92%",
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignSelf: "center",
    marginBottom: 18,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: "#162334",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  detectedLabel: {
    fontSize: 9.5,
    color: "#64748B",
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  diseaseName: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  severityBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  severityIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  severityTitle: { fontSize: 13.5, fontWeight: "800", marginBottom: 2 },
  severitySub: { fontSize: 11.5, color: "#94A3B8" },
  section: { marginBottom: 14 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionBody: { fontSize: 13, color: "#CBD5E1", lineHeight: 19 },
  solutionBox: {
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.2)",
  },
  solutionBody: { fontSize: 13, color: "#E2E8F0", lineHeight: 19 },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "center",
    marginBottom: 16,
  },
  metaText: { fontSize: 11, color: "#64748B" },
  closeBtn: {
    backgroundColor: "#10B981",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  closeBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});

// History Card
function HistoryCard({
  item,
  onPress,
}: {
  item: Prediction;
  onPress: () => void;
}) {
  const pct = Math.round(item.confidence * 100);
  const isHealthy = item.diseaseName.toLowerCase().includes("healthy");
  const color = isHealthy ? "#34D399" : pct >= 75 ? "#F87171" : "#FB923C";
  const bg = isHealthy
    ? "rgba(52, 211, 153, 0.12)"
    : pct >= 75
    ? "rgba(248, 113, 113, 0.12)"
    : "rgba(251, 146, 60, 0.12)";
  const date = new Date(item.predictedAt);

  return (
    <TouchableOpacity style={hc.card} onPress={onPress} activeOpacity={0.8}>
      <Image source={{ uri: item.imageUrl }} style={hc.image} />
      <View style={hc.info}>
        <Text style={hc.disease} numberOfLines={1}>
          {item.diseaseName}
        </Text>
        <View style={hc.dateRow}>
          <Ionicons name="calendar-outline" size={10} color="#64748B" />
          <Text style={hc.time}>
            {date.toLocaleDateString([], { month: "short", day: "numeric" })} ·{" "}
            {date.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View style={[hc.badge, { backgroundColor: bg }]}>
          <View style={[hc.dot, { backgroundColor: color }]} />
          <Text style={[hc.badgeText, { color }]}>{pct}% match</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#64748B" />
    </TouchableOpacity>
  );
}

const hc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111C2A",
    borderRadius: 16,
    padding: 12,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    gap: 12,
  },
  image: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#162334",
  },
  info: { flex: 1 },
  disease: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 3,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 5,
  },
  time: { fontSize: 10.5, color: "#64748B" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
  },
  dot: { width: 4, height: 4, borderRadius: 2 },
  badgeText: { fontSize: 10.5, fontWeight: "800" },
});

// Main Screen
export default function AIScanScreen() {
  const [activeTab, setActiveTab] = useState<"scan" | "history">("scan");
  const [step, setStep] = useState<Step>("idle");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [result, setResult] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<Prediction | null>(null);

  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(tabAnim, {
      toValue: activeTab === "scan" ? 0 : 1,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getMyPredictions();
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert("Error", "Could not load prediction history");
    } finally {
      setLoadingHistory(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, []);

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!picked.canceled && picked.assets[0]) {
      setImageUri(picked.assets[0].uri);
      setUploadedUrl(null);
      setStep("picked");
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const photo = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!photo.canceled && photo.assets[0]) {
      setImageUri(photo.assets[0].uri);
      setUploadedUrl(null);
      setStep("picked");
    }
  };

  const uploadToSupabase = async () => {
    if (!imageUri) return;
    setStep("uploading");
    try {
      const publicUrl = await uploadImageToSupabase(imageUri);
      setUploadedUrl(publicUrl);
      setStep("uploaded");
    } catch (err: any) {
      setStep("error");
      Alert.alert("Upload Failed", err.message || "Could not upload image");
    }
  };

  const runPrediction = async (imageUrl: string) => {
    setStep("analyzing");
    try {
      const prediction = await predictDisease(imageUrl);
      if (prediction?.diseaseName) {
        setResult(prediction);
        setStep("done");
        fetchHistory();
      } else {
        setStep("error");
        Alert.alert(
          "Analysis failed",
          prediction?.message || "Unexpected response"
        );
      }
    } catch {
      setStep("error");
      Alert.alert("Error", "Network error. Please try again.");
    }
  };

  const resetScan = () => {
    setImageUri(null);
    setUploadedUrl(null);
    setStep("idle");
    setResult(null);
  };

  const isBusy = step === "uploading" || step === "analyzing";

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={s.header}>
        <View>
          <View style={s.badgePill}>
            <View style={s.badgePulseDot} />
            <Text style={s.badgePillText}>AI VISION LAB</Text>
          </View>
          <Text style={s.headerTitle}>AI Plant Scan</Text>
          <Text style={s.headerSub}>Neural plant disease diagnostic engine</Text>
        </View>
        <View style={s.headerIconBox}>
          <Ionicons name="flask" size={20} color="#34D399" />
        </View>
      </View>

      {/* Tab bar */}
      <View style={s.tabBar}>
        <TouchableOpacity
          style={s.tabItem}
          onPress={() => setActiveTab("scan")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="scan-outline"
            size={15}
            color={activeTab === "scan" ? "#34D399" : "#64748B"}
          />
          <Text style={[s.tabText, activeTab === "scan" && s.tabTextActive]}>
            Scan Lab
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={s.tabItem}
          onPress={() => setActiveTab("history")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="time-outline"
            size={15}
            color={activeTab === "history" ? "#34D399" : "#64748B"}
          />
          <Text style={[s.tabText, activeTab === "history" && s.tabTextActive]}>
            History ({history.length})
          </Text>
        </TouchableOpacity>
        <Animated.View
          style={[
            s.tabIndicator,
            {
              left: tabAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ["5%", "55%"],
              }),
            },
          ]}
        />
      </View>

      {/* SCAN TAB */}
      {activeTab === "scan" && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <StepProgress step={step} />
          <StatusMessage step={step} />

          {/* Idle: picker card */}
          {step === "idle" && (
            <View style={s.pickerCard}>
              <View style={s.pickerIconBox}>
                <Ionicons name="leaf" size={34} color="#34D399" />
              </View>
              <Text style={s.pickerTitle}>Diagnose a Plant</Text>
              <Text style={s.pickerSub}>
                Capture or upload a clear photo of the leaf surface to run instant neural analysis
              </Text>

              <View style={s.pickerBtnRow}>
                <TouchableOpacity
                  style={s.pickerPrimaryBtn}
                  onPress={takePhoto}
                  activeOpacity={0.88}
                >
                  <Ionicons name="camera" size={17} color="#FFFFFF" />
                  <Text style={s.pickerPrimaryBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.pickerSecondaryBtn}
                  onPress={pickFromGallery}
                  activeOpacity={0.85}
                >
                  <Ionicons name="images-outline" size={17} color="#34D399" />
                  <Text style={s.pickerSecondaryBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>

              <View style={s.tips}>
                {[
                  "Ensure bright natural lighting on the leaf",
                  "Keep the affected area centered in focus",
                  "Avoid blurry, distant, or backlit shots",
                ].map((t, i) => (
                  <View key={i} style={s.tipRow}>
                    <Ionicons name="checkmark-circle-outline" size={13} color="#34D399" />
                    <Text style={s.tipText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Image preview */}
          {imageUri && step !== "idle" && (
            <View style={s.previewCard}>
              <Image source={{ uri: imageUri }} style={s.previewImage} resizeMode="cover" />
              {isBusy && (
                <View style={s.previewOverlay}>
                  <ActivityIndicator color="#34D399" size="large" />
                </View>
              )}
              {!isBusy && step !== "done" && (
                <TouchableOpacity style={s.removeBtn} onPress={resetScan} activeOpacity={0.8}>
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action buttons */}
          {step === "picked" && (
            <TouchableOpacity
              style={s.actionBtn}
              onPress={uploadToSupabase}
              activeOpacity={0.88}
            >
              <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" />
              <Text style={s.actionBtnText}>Upload & Prepare Scan</Text>
            </TouchableOpacity>
          )}
          {step === "uploaded" && (
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnGhost]}
              onPress={() => runPrediction(uploadedUrl!)}
              activeOpacity={0.88}
            >
              <Ionicons name="flask-outline" size={18} color="#34D399" />
              <Text style={[s.actionBtnText, { color: "#34D399" }]}>Run Neural Analysis</Text>
            </TouchableOpacity>
          )}
          {step === "done" && (
            <View style={s.doneActions}>
              <TouchableOpacity
                style={[s.actionBtn, s.actionBtnGhost]}
                onPress={() => setResult(result)}
                activeOpacity={0.88}
              >
                <Ionicons name="document-text-outline" size={18} color="#34D399" />
                <Text style={[s.actionBtnText, { color: "#34D399" }]}>View Full Report</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.resetBtn} onPress={resetScan} activeOpacity={0.7}>
                <Text style={s.resetBtnText}>Scan another plant</Text>
              </TouchableOpacity>
            </View>
          )}
          {step === "error" && (
            <TouchableOpacity
              style={[s.actionBtn, s.actionBtnError]}
              onPress={resetScan}
              activeOpacity={0.88}
            >
              <Ionicons name="refresh-outline" size={18} color="#F87171" />
              <Text style={[s.actionBtnText, { color: "#F87171" }]}>Try Again</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 50 }} />
        </ScrollView>
      )}

      {/* HISTORY TAB */}
      {activeTab === "history" && (
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
          {loadingHistory ? (
            <ActivityIndicator color="#10B981" style={{ marginTop: 60 }} />
          ) : history.length === 0 ? (
            <View style={s.emptyState}>
              <View style={s.emptyIconBox}>
                <Ionicons name="leaf-outline" size={38} color="#10B981" />
              </View>
              <Text style={s.emptyTitle}>No scan logs yet</Text>
              <Text style={s.emptySub}>
                Diagnose your first crop leaf and your historical findings will appear here
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => setActiveTab("scan")}
                activeOpacity={0.88}
              >
                <Ionicons name="scan-outline" size={16} color="#FFFFFF" />
                <Text style={s.emptyBtnText}>Start First Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.histCount}>
                {history.length} DIAGNOSTIC SCAN{history.length !== 1 ? "S" : ""} RECORDED
              </Text>
              {history.map((item) => (
                <HistoryCard
                  key={item._id}
                  item={item}
                  onPress={() => setSelectedHistory(item)}
                />
              ))}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <ResultModal result={result} onClose={() => setResult(null)} />
      <ResultModal result={selectedHistory} onClose={() => setSelectedHistory(null)} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B131E" },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 14,
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
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 12.5,
    color: "#94A3B8",
    marginTop: 2,
    fontWeight: "600",
  },
  headerIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Tab Bar */
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
  tabIndicator: {
    position: "absolute",
    bottom: 4,
    height: 2.5,
    width: "40%",
    backgroundColor: "#34D399",
    borderRadius: 2,
  },

  scroll: { paddingHorizontal: 16 },

  /* Picker Card */
  pickerCard: {
    backgroundColor: "#111C2A",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 14,
  },
  pickerIconBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  pickerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  pickerSub: {
    fontSize: 12.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  pickerBtnRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginBottom: 20,
  },
  pickerPrimaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  pickerPrimaryBtnText: { fontSize: 13.5, fontWeight: "800", color: "#FFFFFF" },
  pickerSecondaryBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
    backgroundColor: "#162334",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  pickerSecondaryBtnText: { fontSize: 13.5, fontWeight: "800", color: "#34D399" },
  tips: { width: "100%", gap: 7, paddingTop: 4 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  tipText: { fontSize: 11.5, color: "#94A3B8", fontWeight: "600" },

  /* Preview */
  previewCard: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    position: "relative",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  previewImage: { width: "100%", height: 260 },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11, 19, 30, 0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Action Buttons */
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 14,
    height: 52,
    marginBottom: 10,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnGhost: {
    backgroundColor: "#111C2A",
    borderWidth: 1.2,
    borderColor: "rgba(52, 211, 153, 0.35)",
    shadowOpacity: 0,
  },
  actionBtnError: {
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
    shadowOpacity: 0,
  },
  actionBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  doneActions: { gap: 4 },
  resetBtn: { alignItems: "center", paddingVertical: 12 },
  resetBtnText: { color: "#94A3B8", fontSize: 13, fontWeight: "700" },

  histCount: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1.2,
    marginBottom: 12,
  },

  /* Empty State */
  emptyState: {
    alignItems: "center",
    backgroundColor: "#111C2A",
    borderRadius: 20,
    paddingVertical: 44,
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
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  emptySub: {
    fontSize: 12.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#10B981",
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
});