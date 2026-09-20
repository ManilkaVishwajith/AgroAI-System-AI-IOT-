import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { onValue, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { removeDevice } from "../../../src/api";
import { db } from "../../../src/utils/firebase";

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;
const CONNECTION_TIMEOUT_MS = 15 * 1000;

type SensorData = {
  temperature?: number;
  humidity?: number;
  soil?: number;
  soilMoisture?: number;
  lastSeen?: number | string;
  [key: string]: unknown;
};

function decodeDeviceId(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseLastSeen(value: SensorData["lastSeen"]) {
  if (value === undefined || value === null || value === "") {
    return new Date();
  }

  const timestamp = Number(value);

  if (!Number.isFinite(timestamp)) {
    return new Date();
  }

  return new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000);
}

function sendSoilAlert(deviceId: string, soilValue: number) {
  Alert.alert(
    "Low Soil Moisture",
    `Device ${deviceId}: Soil moisture is ${soilValue}%.\n\nYour plant needs water!`,
    [{ text: "Got it", style: "default" }],
  );
}

export default function DeviceDataScreen() {
  const params = useLocalSearchParams<{
    deviceId?: string | string[];
  }>();

  const rawDeviceId = Array.isArray(params.deviceId)
    ? params.deviceId[0]
    : params.deviceId;

  const deviceId = rawDeviceId ? decodeDeviceId(rawDeviceId) : "";

  const [data, setData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [removing, setRemoving] = useState(false);

  const alertCooldown = useRef(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.25,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const ticker = setInterval(() => {
      if (lastUpdated) {
        setIsOffline(
          Date.now() - lastUpdated.getTime() > OFFLINE_THRESHOLD_MS,
        );
      }
    }, 30_000);

    return () => clearInterval(ticker);
  }, [lastUpdated]);

  useEffect(() => {
    if (!deviceId) {
      setLoading(false);
      setConnectionError("No device ID was provided in the route.");
      return;
    }

    const firebasePath = `devices/${deviceId}`;
    const deviceReference = ref(db, firebasePath);
    let completedInitialLoad = false;

    setLoading(true);
    setConnectionError(null);

    const connectionTimeout = setTimeout(() => {
      if (completedInitialLoad) return;
      setLoading(false);
      setConnectionError(
        "Firebase did not respond. Check your internet connection, database URL, and Realtime Database rules.",
      );
    }, CONNECTION_TIMEOUT_MS);

    const unsubscribe = onValue(
      deviceReference,
      (snapshot) => {
        completedInitialLoad = true;
        clearTimeout(connectionTimeout);
        setConnectionError(null);

        const value = snapshot.val();

        if (!value) {
          setData(null);
          setLastUpdated(null);
          setIsOffline(false);
          setLoading(false);
          return;
        }

        const normalized: SensorData = value.sensors ?? value;
        const dataTime = parseLastSeen(normalized.lastSeen);
        const age = Date.now() - dataTime.getTime();

        setData(normalized);
        setLastUpdated(dataTime);
        setIsOffline(age > OFFLINE_THRESHOLD_MS);

        const soilValue = Number(
          normalized.soil ?? normalized.soilMoisture ?? NaN,
        );

        if (
          Number.isFinite(soilValue) &&
          soilValue < 30 &&
          !alertCooldown.current &&
          age <= OFFLINE_THRESHOLD_MS
        ) {
          alertCooldown.current = true;
          sendSoilAlert(deviceId, soilValue);

          cooldownTimer.current = setTimeout(() => {
            alertCooldown.current = false;
          }, 5 * 60 * 1000);
        }

        setLoading(false);
      },
      (error) => {
        completedInitialLoad = true;
        clearTimeout(connectionTimeout);

        const firebaseError = error as Error & { code?: string };
        const errorCode = firebaseError.code ?? "unknown";
        const permissionDenied =
          errorCode.toLowerCase().includes("permission") ||
          firebaseError.message.toLowerCase().includes("permission");

        setLoading(false);
        setConnectionError(
          permissionDenied
            ? "Firebase denied permission to read this device. Check your Realtime Database rules."
            : firebaseError.message || "Unable to load Firebase data.",
        );
      },
    );

    return () => {
      clearTimeout(connectionTimeout);
      unsubscribe();

      if (cooldownTimer.current) {
        clearTimeout(cooldownTimer.current);
        cooldownTimer.current = null;
      }
    };
  }, [deviceId, retryKey]);

  function retryConnection() {
    setConnectionError(null);
    setLoading(true);
    setRetryKey((current) => current + 1);
  }

  function getSoilStatus(value: number) {
    if (value < 30) {
      return {
        label: "Dry — Needs Water",
        color: "#F87171",
        bg: "rgba(248, 113, 113, 0.12)",
        border: "rgba(248, 113, 113, 0.28)",
      };
    }

    if (value < 60) {
      return {
        label: "Moderate",
        color: "#FBBF24",
        bg: "rgba(251, 191, 36, 0.12)",
        border: "rgba(251, 191, 36, 0.28)",
      };
    }

    return {
      label: "Well Hydrated",
      color: "#34D399",
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(52, 211, 153, 0.28)",
    };
  }

  function getTempStatus(value: number) {
    if (value < 15) {
      return {
        label: "Too Cold",
        color: "#38BDF8",
        bg: "rgba(56, 189, 248, 0.12)",
        border: "rgba(56, 189, 248, 0.28)",
      };
    }

    if (value > 35) {
      return {
        label: "Too Hot",
        color: "#F87171",
        bg: "rgba(248, 113, 113, 0.12)",
        border: "rgba(248, 113, 113, 0.28)",
      };
    }

    return {
      label: "Optimal",
      color: "#34D399",
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(52, 211, 153, 0.28)",
    };
  }

  function getHumidStatus(value: number) {
    if (value < 30) {
      return {
        label: "Too Dry",
        color: "#F87171",
        bg: "rgba(248, 113, 113, 0.12)",
        border: "rgba(248, 113, 113, 0.28)",
      };
    }

    if (value > 80) {
      return {
        label: "Too Humid",
        color: "#FBBF24",
        bg: "rgba(251, 191, 36, 0.12)",
        border: "rgba(251, 191, 36, 0.28)",
      };
    }

    return {
      label: "Normal",
      color: "#34D399",
      bg: "rgba(16, 185, 129, 0.12)",
      border: "rgba(52, 211, 153, 0.28)",
    };
  }

  function formatTimeAgo(date: Date) {
    const minutes = Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / 60_000),
    );

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    return `${Math.floor(hours / 24)}d ago`;
  }

  function handleRemove() {
    setShowMenu(false);

    if (!deviceId) {
      Alert.alert("Error", "Device ID is missing.");
      return;
    }

    Alert.alert("Remove Device", `Remove ${deviceId} from your account?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          setRemoving(true);

          try {
            const response = await removeDevice(deviceId);

            if (response.message === "Device removed successfully") {
              Alert.alert("Removed", "Device removed.", [
                {
                  text: "OK",
                  onPress: () => router.replace("/(user)/devices"),
                },
              ]);
            } else {
              Alert.alert("Error", response.message);
            }
          } catch (error) {
            console.error("Remove device failed:", error);
            Alert.alert("Error", "Something went wrong.");
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIconBox}>
          <MaterialCommunityIcons
            name="antenna"
            size={36}
            color="#34D399"
          />
        </View>
        <Text style={styles.loadingTitle}>Connecting Node...</Text>
        <Text style={styles.loadingSubtext}>Establishing link with IoT telemetry stream</Text>
        <ActivityIndicator color="#10B981" style={{ marginTop: 22 }} />
      </View>
    );
  }

  if (connectionError) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorIconBox}>
          <Ionicons name="cloud-offline-outline" size={40} color="#F87171" />
        </View>
        <Text style={styles.errorTitle}>Gateway Offline</Text>
        <Text style={styles.errorMessage}>{connectionError}</Text>
        <Text style={styles.errorDeviceId}>
          {deviceId ? `Node ID: ${deviceId}` : "Device ID unavailable"}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={retryConnection}
          activeOpacity={0.8}
        >
          <Ionicons name="refresh" size={18} color="#ffffff" />
          <Text style={styles.retryButtonText}>Reconnect</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.errorBackButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.errorBackButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const temperatureValue = Number(data?.temperature ?? 0);
  const humidityValue = Number(data?.humidity ?? 0);
  const soilValue = Number(data?.soil ?? data?.soilMoisture ?? 0);
  const soilProgress = Math.max(0, Math.min(100, soilValue));

  const soil = data ? getSoilStatus(soilValue) : null;
  const temperature = data ? getTempStatus(temperatureValue) : null;
  const humidity = data ? getHumidStatus(humidityValue) : null;

  const needsAlert =
    !isOffline &&
    Boolean(data) &&
    (soilValue < 30 || temperatureValue > 35 || temperatureValue < 15);

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backIconBox}>
              <Ionicons name="arrow-back" size={16} color="#34D399" />
            </View>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
            <View style={styles.menuDot} />
          </TouchableOpacity>
        </View>

        {/* Identity & Status */}
        <View style={styles.identitySection}>
          <View style={styles.deviceIconBox}>
            <MaterialCommunityIcons
              name="antenna"
              size={36}
              color="#34D399"
            />
          </View>

          <Text style={styles.deviceIdText}>{deviceId}</Text>

          <View style={styles.lastSeenRow}>
            <Ionicons name="time-outline" size={13} color="#64748B" />
            <Text style={styles.lastSeenText}>
              {lastUpdated
                ? `Last seen ${formatTimeAgo(lastUpdated)}`
                : "Waiting for telemetry stream..."}
            </Text>
          </View>

          {isOffline ? (
            <View style={styles.offlinePill}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlinePillText}>NODE OFFLINE</Text>
            </View>
          ) : (
            <View style={styles.livePill}>
              <Animated.View
                style={[styles.liveDot, { opacity: pulse }]}
              />
              <Text style={styles.livePillText}>LIVE TELEMETRY</Text>
            </View>
          )}
        </View>

        {/* Offline Banner */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <View style={styles.offlineBannerIconBox}>
              <Ionicons name="wifi-outline" size={18} color="#FBBF24" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineBannerTitle}>Hardware Node Disconnected</Text>
              <Text style={styles.offlineBannerText}>
                No packets received for 5+ minutes. Cached readings are from{" "}
                <Text style={styles.offlineBannerBold}>
                  {lastUpdated ? formatTimeAgo(lastUpdated) : "unknown"}
                </Text>
                .
              </Text>
            </View>
          </View>
        )}

        {/* Main Sensor Panels */}
        {data ? (
          <View style={isOffline ? styles.dimmed : undefined}>
            <View style={styles.metricsRow}>
              {/* Temperature */}
              <View
                style={[
                  styles.metricCard,
                  { borderTopColor: temperature?.color },
                ]}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: temperature?.bg },
                  ]}
                >
                  <Ionicons
                    name="thermometer-outline"
                    size={22}
                    color={temperature?.color}
                  />
                </View>
                <Text style={styles.metricValue}>
                  {temperatureValue.toFixed(1)}
                  <Text style={styles.metricUnit}>°C</Text>
                </Text>
                <Text style={styles.metricLabel}>TEMPERATURE</Text>
                <View
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: temperature?.bg,
                      borderColor: temperature?.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: temperature?.color },
                    ]}
                  >
                    {temperature?.label}
                  </Text>
                </View>
              </View>

              {/* Humidity */}
              <View
                style={[
                  styles.metricCard,
                  { borderTopColor: humidity?.color },
                ]}
              >
                <View
                  style={[
                    styles.metricIconBox,
                    { backgroundColor: humidity?.bg },
                  ]}
                >
                  <Ionicons
                    name="water-outline"
                    size={22}
                    color={humidity?.color}
                  />
                </View>
                <Text style={styles.metricValue}>
                  {humidityValue.toFixed(1)}
                  <Text style={styles.metricUnit}>%</Text>
                </Text>
                <Text style={styles.metricLabel}>HUMIDITY</Text>
                <View
                  style={[
                    styles.statusChip,
                    {
                      backgroundColor: humidity?.bg,
                      borderColor: humidity?.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      { color: humidity?.color },
                    ]}
                  >
                    {humidity?.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* Soil Moisture */}
            <View style={styles.soilCard}>
              <View style={styles.soilTopRow}>
                <View style={styles.soilTitleRow}>
                  <View
                    style={[
                      styles.metricIconBox,
                      { backgroundColor: soil?.bg },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="sprout-outline"
                      size={22}
                      color={soil?.color}
                    />
                  </View>
                  <View>
                    <Text style={styles.soilTitle}>Soil Moisture</Text>
                    <View
                      style={[
                        styles.statusChip,
                        {
                          backgroundColor: soil?.bg,
                          borderColor: soil?.border,
                          alignSelf: "flex-start",
                          marginTop: 4,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusChipText,
                          { color: soil?.color },
                        ]}
                      >
                        {soil?.label}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.soilBigNumber, { color: soil?.color }]}>
                  {soilValue}
                  <Text style={styles.soilBigUnit}>%</Text>
                </Text>
              </View>

              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${soilProgress}%` as `${number}%`,
                      backgroundColor: soil?.color,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>0% Parched</Text>
                <Text style={styles.progressLabel}>100% Saturated</Text>
              </View>
            </View>

            {/* Action Alert */}
            {needsAlert && (
              <View style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertIconBox}>
                    <Ionicons name="warning" size={16} color="#FBBF24" />
                  </View>
                  <Text style={styles.alertTitle}>Action Required</Text>
                </View>

                {soilValue < 30 && (
                  <View style={styles.alertRow}>
                    <View
                      style={[
                        styles.alertBullet,
                        { backgroundColor: "#F87171" },
                      ]}
                    />
                    <Text style={styles.alertText}>
                      Critical moisture level — immediate irrigation advised.
                    </Text>
                  </View>
                )}

                {temperatureValue > 35 && (
                  <View style={styles.alertRow}>
                    <View
                      style={[
                        styles.alertBullet,
                        { backgroundColor: "#F87171" },
                      ]}
                    />
                    <Text style={styles.alertText}>
                      High temperature reading — inspect greenhouse airflow.
                    </Text>
                  </View>
                )}

                {temperatureValue < 15 && (
                  <View style={styles.alertRow}>
                    <View
                      style={[
                        styles.alertBullet,
                        { backgroundColor: "#38BDF8" },
                      ]}
                    />
                    <Text style={styles.alertText}>
                      Low temperature reading — verify climate heating.
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Info Strip */}
            <View style={styles.infoStrip}>
              <View style={styles.infoBlock}>
                <Ionicons
                  name="hardware-chip-outline"
                  size={14}
                  color="#64748B"
                  style={{ marginBottom: 5 }}
                />
                <Text style={styles.infoLabel}>DEVICE NODE</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {deviceId}
                </Text>
              </View>

              <View style={styles.infoSeparator} />

              <View style={styles.infoBlock}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color="#64748B"
                  style={{ marginBottom: 5 }}
                />
                <Text style={styles.infoLabel}>LAST PACKET</Text>
                <Text style={styles.infoValue}>
                  {lastUpdated
                    ? lastUpdated.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—"}
                </Text>
              </View>

              <View style={styles.infoSeparator} />

              <View style={styles.infoBlock}>
                <Ionicons
                  name={
                    isOffline
                      ? "cloud-offline-outline"
                      : "cloud-done-outline"
                  }
                  size={14}
                  color={isOffline ? "#F87171" : "#34D399"}
                  style={{ marginBottom: 5 }}
                />
                <Text style={styles.infoLabel}>GATEWAY</Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: isOffline ? "#F87171" : "#34D399" },
                  ]}
                >
                  {isOffline ? "Offline" : "Connected"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          /* Empty State */
          <View style={styles.noDataCard}>
            <View style={styles.noDataIconBox}>
              <MaterialCommunityIcons
                name="antenna"
                size={40}
                color="#34D399"
              />
            </View>
            <Text style={styles.noDataTitle}>No Telemetry Stream</Text>
            <Text style={styles.noDataSubtitle}>
              Connected to Firebase cluster successfully, awaiting data packets from{" "}
              <Text style={{ color: "#34D399", fontFamily: "Courier" }}>devices/{deviceId}</Text>.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Options Modal Sheet */}
      <Modal
        visible={showMenu}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{deviceId}</Text>
            <Text style={styles.sheetSubtitle}>Hardware node configuration</Text>

            <TouchableOpacity
              style={styles.sheetDangerButton}
              onPress={handleRemove}
              disabled={removing}
              activeOpacity={0.85}
            >
              {removing ? (
                <ActivityIndicator size="small" color="#F87171" />
              ) : (
                <>
                  <Ionicons name="trash-outline" size={18} color="#F87171" />
                  <Text style={styles.sheetDangerText}>Unbind Device Node</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelButton}
              onPress={() => setShowMenu(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#080D14",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#080D14",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  loadingIconBox: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: "#111C2A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  loadingSubtext: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#080D14",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  errorIconBox: {
    width: 84,
    height: 84,
    borderRadius: 24,
    backgroundColor: "#111C2A",
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    shadowColor: "#F87171",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  errorTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  errorMessage: {
    color: "#94A3B8",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 12,
  },
  errorDeviceId: {
    color: "#64748B",
    fontSize: 12,
    marginBottom: 24,
    fontFamily: "Courier",
  },
  retryButton: {
    minWidth: 190,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
    marginBottom: 12,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  errorBackButton: {
    minWidth: 190,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111C2A",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  errorBackButtonText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "700",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#111C2A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  backText: {
    color: "#34D399",
    fontSize: 14.5,
    fontWeight: "700",
  },
  menuButton: {
    flexDirection: "row",
    gap: 4,
    padding: 10,
    backgroundColor: "#111C2A",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  menuDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: "#94A3B8",
  },
  identitySection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  deviceIconBox: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: "#111C2A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.35)",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  deviceIdText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  lastSeenRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 14,
  },
  lastSeenText: {
    color: "#64748B",
    fontSize: 12.5,
    fontWeight: "500",
  },
  livePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#34D399",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  livePillText: {
    color: "#34D399",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  offlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.3)",
  },
  offlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#F87171",
  },
  offlinePillText: {
    color: "#F87171",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  offlineBanner: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginHorizontal: 18,
    marginBottom: 18,
    backgroundColor: "rgba(251, 191, 36, 0.08)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.25)",
  },
  offlineBannerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  offlineBannerTitle: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 3,
  },
  offlineBannerText: {
    color: "#FDE68A",
    fontSize: 12,
    lineHeight: 18,
  },
  offlineBannerBold: {
    fontWeight: "800",
    color: "#FFFFFF",
  },
  dimmed: {
    opacity: 0.5,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#111C2A",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderTopWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  metricIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  metricValue: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 36,
    marginBottom: 3,
    letterSpacing: -0.5,
  },
  metricUnit: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  metricLabel: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  statusChip: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  soilCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: "#111C2A",
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 4,
  },
  soilTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  soilTitleRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  soilTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
  },
  soilBigNumber: {
    fontSize: 44,
    fontWeight: "900",
    lineHeight: 48,
    letterSpacing: -1,
  },
  soilBigUnit: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
  },
  progressTrack: {
    height: 8,
    backgroundColor: "#0D1622",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: "#64748B",
    fontSize: 10.5,
    fontWeight: "600",
  },
  alertCard: {
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: "rgba(248, 113, 113, 0.08)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.25)",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  alertIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "rgba(251, 191, 36, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitle: {
    color: "#FBBF24",
    fontSize: 13,
    fontWeight: "800",
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 5,
  },
  alertBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  alertText: {
    color: "#FCA5A5",
    fontSize: 12.5,
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
  },
  infoStrip: {
    flexDirection: "row",
    marginHorizontal: 18,
    marginBottom: 14,
    backgroundColor: "#111C2A",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  infoBlock: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  infoSeparator: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 12,
  },
  infoLabel: {
    color: "#64748B",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  infoValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  noDataCard: {
    margin: 18,
    backgroundColor: "#111C2A",
    borderRadius: 24,
    padding: 36,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  noDataIconBox: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: "#0D1622",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  noDataTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  noDataSubtitle: {
    color: "#94A3B8",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#111C2A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 42,
    borderTopWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 16,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  sheetSubtitle: {
    color: "#64748B",
    fontSize: 12.5,
    textAlign: "center",
    marginBottom: 26,
    marginTop: 4,
  },
  sheetDangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(248, 113, 113, 0.12)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(248, 113, 113, 0.28)",
    marginBottom: 12,
  },
  sheetDangerText: {
    color: "#F87171",
    fontSize: 14.5,
    fontWeight: "800",
  },
  sheetCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0D1622",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  sheetCancelText: {
    color: "#94A3B8",
    fontSize: 14.5,
    fontWeight: "700",
  },
});