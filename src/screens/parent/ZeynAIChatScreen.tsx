import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useZeynChat } from "../../hooks/useZeynAI";
import type { ZeynAIStackParamList } from "../../navigation/ZeynAIStack";

export default function ZeynAIChatScreen() {
  const route = useRoute<RouteProp<ZeynAIStackParamList, "ZeynAIChat">>();
  const { conversationId } = route.params;
  const { messages, hasMore, loadMore, send, streaming, liveText } = useZeynChat(conversationId);
  const [text, setText] = useState("");
  const listRef = useRef<FlatList<any>>(null);

  const onSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setText("");
    send(trimmed);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
  }, [text, send]);

  // автоскролл при новых токенах/сообщениях
  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages, liveText]);

  // готовим массив для FlatList (добавляем live-пузырь, но только если есть текст)
  const data = liveText
    ? [...messages, { id: "live", role: "assistant", content: liveText, createdAtUtc: new Date().toISOString() }]
    : messages;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        contentContainerStyle={{ padding: 16 }}
        data={data}
        keyExtractor={(x) => x.id}
        onEndReached={() => hasMore && loadMore()}
        onEndReachedThreshold={0.2}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.role === "user" ? "flex-end" : "flex-start",
              backgroundColor: item.role === "user" ? "#DCFCE7" : "#F1F5F9",
              padding: 12,
              marginBottom: 8,
              borderRadius: 12,
              maxWidth: "85%",
              opacity: item.id === "live" ? 0.9 : 1,
            }}
          >
            <Text>{item.content}</Text>
          </View>
        )}
        ListHeaderComponent={
          hasMore ? (
            <TouchableOpacity onPress={loadMore} style={{ alignSelf: "center", padding: 8 }}>
              <Text style={{ color: "#2563EB" }}>Загрузить ещё</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={{ flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#eee" }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={streaming ? "Ассистент печатает…" : "Напишите сообщение"}
          style={{
            flex: 1,
            backgroundColor: "#fff",
            borderWidth: 1,
            borderColor: "#e5e7eb",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
          editable={!streaming}
          multiline
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!text.trim()}
          style={{
            marginLeft: 8,
            backgroundColor: "#22C55E",
            paddingHorizontal: 16,
            justifyContent: "center",
            borderRadius: 12,
            opacity: text.trim() ? 1 : 0.6,
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Отправить</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
