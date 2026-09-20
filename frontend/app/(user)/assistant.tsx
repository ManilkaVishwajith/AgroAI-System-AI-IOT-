import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getUserChats, sendMessage } from "../../src/api";

const SCREEN_W = Dimensions.get("window").width;

// Helpers
function parseReply(raw: string): string {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw);
    return (
      parsed?.reply ??
      parsed?.response ??
      parsed?.message ??
      parsed?.text ??
      parsed?.answer ??
      JSON.stringify(parsed)
    );
  } catch {
    return raw;
  }
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Markdown Formatted Text (Renders **bold** in White #FFFFFF)
function FormattedText({
  text,
  style,
}: {
  text: string;
  style?: any;
}) {
  if (!text) return null;

  const parts = text.split(/(\*\*.*?\*\*)/g);

  return (
    <Text style={style}>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          const content = part.slice(2, -2);
          return (
            <Text key={index} style={{ fontWeight: "800", color: "#FFFFFF" }}>
              {content}
            </Text>
          );
        }
        return part;
      })}
    </Text>
  );
}

interface ChatMessage {
  _id: string;
  message: string;
  reply: string;
  createdAt: string;
  conversationId?: string;
}
interface Bubble {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
  pending?: boolean;
}

// Typing dots
function TypingDots() {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, {
            toValue: -5,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.delay(500),
        ]),
      ),
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={td.wrap}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={[td.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}
const td = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
});

// Date separator
function DateSeparator({ label }: { label: string }) {
  return (
    <View style={ds.wrap}>
      <View style={ds.line} />
      <Text style={ds.text}>{label}</Text>
      <View style={ds.line} />
    </View>
  );
}
const ds = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    gap: 10,
    paddingHorizontal: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.06)" },
  text: {
    fontSize: 10.5,
    color: "#64748B",
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});

// Chat bubble
function ChatBubble({ bubble }: { bubble: Bubble }) {
  const isUser = bubble.role === "user";
  const slideAnim = useRef(new Animated.Value(isUser ? 24 : -24)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 80,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        bub.row,
        isUser ? bub.rowUser : bub.rowBot,
        { opacity: opacityAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {/* Bot avatar */}
      {!isUser && (
        <View style={bub.botAvatar}>
          <MaterialCommunityIcons name="robot" size={16} color="#34D399" />
        </View>
      )}

      {/* Bubble */}
      <View style={[bub.bubble, isUser ? bub.bubbleUser : bub.bubbleBot]}>
        {bubble.pending ? (
          <TypingDots />
        ) : (
          <>
            <FormattedText
              text={bubble.text}
              style={[bub.text, isUser ? bub.textUser : bub.textBot]}
            />
            <Text style={[bub.time, isUser ? bub.timeUser : bub.timeBot]}>
              {formatTime(bubble.time)}
            </Text>
          </>
        )}
      </View>

      {/* User avatar */}
      {isUser && (
        <View style={bub.userAvatar}>
          <Ionicons name="person" size={13} color="#FFFFFF" />
        </View>
      )}
    </Animated.View>
  );
}
const bub = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    gap: 8,
    paddingHorizontal: 16,
  },
  rowUser: { justifyContent: "flex-end" },
  rowBot: { justifyContent: "flex-start" },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: SCREEN_W * 0.72,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: "#162334",
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(56, 189, 248, 0.2)",
  },
  bubbleBot: {
    backgroundColor: "#111C2A",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  text: { fontSize: 13.5, lineHeight: 20 },
  textUser: { color: "#FFFFFF", fontWeight: "500" },
  textBot: { color: "#CBD5E1", fontWeight: "400" },
  time: { fontSize: 9.5, marginTop: 4, fontWeight: "700" },
  timeUser: { color: "#64748B", textAlign: "right" },
  timeBot: { color: "#64748B" },
});

// Suggestion chips
const SUGGESTIONS = [
  "What diseases affect tomato plants?",
  "How do I treat powdery mildew?",
  "Best fertilizer for leafy greens?",
  "Signs of overwatering my plants?",
];

function SuggestionChips({ onSelect }: { onSelect: (s: string) => void }) {
  return (
    <View style={sug.wrap}>
      <View style={sug.iconBox}>
        <MaterialCommunityIcons name="robot" size={36} color="#34D399" />
      </View>
      <Text style={sug.title}>AgroAi ChatBot</Text>
      <Text style={sug.sub}>
        Your AI-powered agricultural advisor. Ask anything about plant health,
        diseases, or crop management.
      </Text>

      <Text style={sug.chipsLabel}>SUGGESTED QUESTIONS</Text>
      <View style={sug.chips}>
        {SUGGESTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            style={sug.chip}
            onPress={() => onSelect(s)}
            activeOpacity={0.75}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color="#34D399"
            />
            <Text style={sug.chipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
const sug = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 16,
  },
  iconBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(52, 211, 153, 0.3)",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  sub: {
    fontSize: 12.5,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  chipsLabel: {
    fontSize: 9.5,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#111C2A",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  chipText: { fontSize: 12, color: "#E2E8F0", fontWeight: "600" },
});

// History → Bubbles
function historyToBubbles(chats: ChatMessage[]): Bubble[] {
  const sorted = [...chats].reverse();
  const bubbles: Bubble[] = [];
  let lastDate = "";
  for (const chat of sorted) {
    const dateLabel = formatDate(chat.createdAt);
    if (dateLabel !== lastDate) {
      bubbles.push({
        id: `sep_${chat._id}`,
        role: "bot",
        text: dateLabel,
        time: chat.createdAt,
      });
      lastDate = dateLabel;
    }
    bubbles.push({
      id: `user_${chat._id}`,
      role: "user",
      text: chat.message,
      time: chat.createdAt,
    });
    bubbles.push({
      id: `bot_${chat._id}`,
      role: "bot",
      text: parseReply(chat.reply),
      time: chat.createdAt,
    });
  }
  return bubbles;
}

// Main Screen
export default function AssistantScreen() {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [conversationId] = useState(() => `conv_${Date.now()}`);

  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const chats = await getUserChats();
      if (Array.isArray(chats) && chats.length > 0)
        setBubbles(historyToBubbles(chats));
    } catch {
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (bubbles.length > 0)
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        80,
      );
  }, [bubbles.length]);

  const handleSend = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? inputText).trim();
      if (!text || sending) return;

      setInputText("");
      setSending(true);

      const now = new Date().toISOString();
      const tempUserId = `temp_user_${Date.now()}`;
      const tempBotId = `temp_bot_${Date.now()}`;

      setBubbles((prev) => [
        ...prev,
        { id: tempUserId, role: "user", text, time: now },
        { id: tempBotId, role: "bot", text: "", time: now, pending: true },
      ]);

      try {
        const result = await sendMessage(text, conversationId);
        if (result?.data) {
          const reply = parseReply(result.data.reply);
          setBubbles((prev) =>
            prev.map((b) =>
              b.id === tempBotId
                ? {
                    ...b,
                    text: reply,
                    time: result.data.createdAt,
                    pending: false,
                  }
                : b,
            ),
          );
        } else throw new Error("Invalid response");
      } catch {
        setBubbles((prev) =>
          prev.map((b) =>
            b.id === tempBotId
              ? {
                  ...b,
                  text: "Sorry, I couldn't process that. Please try again.",
                  pending: false,
                }
              : b,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [inputText, sending, conversationId],
  );

  const renderItem = useCallback(({ item }: { item: Bubble }) => {
    if (item.id.startsWith("sep_")) return <DateSeparator label={item.text} />;
    return <ChatBubble bubble={item} />;
  }, []);
  const keyExtractor = useCallback((item: Bubble) => item.id, []);
  const isEmpty = !loadingHistory && bubbles.length === 0;
  const headerHeight = insets.top + 12 + 60 + 16;
  const canSend = !!inputText.trim() && !sending;

  return (
    <View style={s.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        {/* Back Button */}
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.replace("/(user)")}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={20} color="#34D399" />
        </TouchableOpacity>

        <View style={s.headerAvatar}>
          <MaterialCommunityIcons name="robot" size={20} color="#34D399" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>AgroAI ChatBot Assistant</Text>
          <View style={s.headerStatusRow}>
            <View style={s.onlineDot} />
            <Text style={s.headerStatusText}>AI Farming Advisor · Online</Text>
          </View>
        </View>
        <View style={s.headerBadge}>
          <Ionicons name="sparkles" size={12} color="#34D399" />
          <Text style={s.headerBadgeText}>AI</Text>
        </View>
      </View>

      {/* KAV */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight : 0}
      >
        {loadingHistory ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color="#10B981" size="large" />
            <Text style={s.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={bubbles}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={[s.listContent, isEmpty && { flex: 1 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              <SuggestionChips onSelect={(s) => handleSend(s)} />
            }
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
          />
        )}

        {/* Input bar */}
        <View
          style={[
            s.inputBar,
            {
              paddingBottom:
                Platform.OS === "ios" ? Math.max(insets.bottom, 8) : 14,
            },
          ]}
        >
          <View style={[s.inputWrap, canSend && s.inputWrapActive]}>
            <Ionicons
              name="leaf-outline"
              size={17}
              color="#34D399"
              style={{ marginBottom: 4 }}
            />
            <TextInput
              ref={inputRef}
              style={s.input}
              placeholder="Ask about your plants..."
              placeholderTextColor="#64748B"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              style={[s.sendBtn, !canSend && s.sendBtnDisabled]}
              onPress={() => handleSend()}
              disabled={!canSend}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="arrow-up" size={17} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={s.hint}>
            Powered by AgriX AI · Conversations are saved
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B131E" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "#0B131E",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#111C2A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  headerTitle: { fontSize: 16, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.3 },
  headerStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34D399",
  },
  headerStatusText: { fontSize: 11, color: "#34D399", fontWeight: "700" },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  headerBadgeText: { fontSize: 10, color: "#34D399", fontWeight: "900" },

  // Loading
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { fontSize: 12.5, color: "#94A3B8", fontWeight: "600" },

  listContent: { paddingTop: 14, paddingBottom: 8 },

  // Input bar
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "#0B131E",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#111C2A",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  inputWrapActive: {
    borderColor: "rgba(52, 211, 153, 0.4)",
    backgroundColor: "#162334",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    maxHeight: 100,
    paddingTop: 6,
    paddingBottom: 6,
    lineHeight: 18,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowOpacity: 0,
  },
  hint: { fontSize: 9.5, color: "#64748B", textAlign: "center", marginTop: 8, fontWeight: "600" },
});