import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  View,
  Text,
  Modal,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useZeynAI } from "../../hooks/useZeynAI";
import { listChildren, type Child } from "../../api/parent/children";

export default function ZeynAIConversationsScreen() {
  const { conversations, refresh, loadingList, ensureConversation } = useZeynAI();
  const nav = useNavigation<any>();

  // дети родителя
  const [children, setChildren] = useState<Child[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      setLoadingChildren(true);
      try {
        const data = await listChildren();
        setChildren(data || []);
      } finally {
        setLoadingChildren(false);
      }
    })();
  }, []);

  const childrenMap = useMemo(
    () =>
      Object.fromEntries(
        (children || []).map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(" ")])
      ),
    [children]
  );

  const openNewConversationFlow = async () => {
    if (loadingChildren) return;

    if (!children || children.length === 0) {
      // у пользователя нет детей — предложим создать
      // тут можешь заменить на свою навигацию на экран создания ребёнка
      alert("Добавьте ребёнка в разделе «Семья», чтобы начать беседу.");
      return;
    }

    if (children.length === 1) {
      // авто — если ровно один
      const child = children[0];
      const id = await ensureConversation(child.id, `Чат: ${child.firstName}`);
      nav.navigate("ZeynAIChat", { conversationId: id, title: `Чат: ${child.firstName}` });
      return;
    }

    // несколько детей — откроем модалку выбора
    setPickerOpen(true);
  };

  const pickChildAndStart = async (child: Child) => {
    setPickerOpen(false);
    const id = await ensureConversation(child.id, `Чат: ${child.firstName}`);
    nav.navigate("ZeynAIChat", { conversationId: id, title: `Чат: ${child.firstName}` });
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={conversations}
        keyExtractor={(x) => x.id}
        refreshControl={<RefreshControl refreshing={loadingList} onRefresh={refresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              nav.navigate("ZeynAIChat", {
                conversationId: item.id,
                title:
                  item.title ||
                  childrenMap[item.childId] ||
                  "Без названия",
              })
            }
            style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: "#eee" }}
          >
            <Text style={{ fontWeight: "600", fontSize: 16 }}>
              {item.title || childrenMap[item.childId] || "Без названия"}
            </Text>
            <Text style={{ color: "#666", marginTop: 4 }}>
              Ходов: {item.turnCount} · Обновлено:{" "}
              {new Date(item.updatedAtUtc).toLocaleString()}
            </Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          !loadingList ? (
            <View style={{ padding: 24, gap: 12 }}>
              <Text>Пока нет активных бесед.</Text>
              <TouchableOpacity
                onPress={openNewConversationFlow}
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#22C55E",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                {loadingChildren ? (
                  <ActivityIndicator color="#fff" />
                ) : null}
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Начать новую беседу
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        ListFooterComponent={
          !loadingList && conversations.length > 0 ? (
            <View style={{ padding: 16 }}>
              <TouchableOpacity
                onPress={openNewConversationFlow}
                style={{
                  alignSelf: "center",
                  backgroundColor: "#22C55E",
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Новая беседа
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Модалка выбора ребёнка */}
      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} onPress={() => setPickerOpen(false)}>
          <View
            style={{
              marginTop: "auto",
              backgroundColor: "#fff",
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", marginBottom: 8 }}>
              К кому начать беседу?
            </Text>
            {children.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => pickChildAndStart(c)}
                style={{
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#eee",
                }}
              >
                <Text style={{ fontSize: 16 }}>
                  {[c.firstName, c.lastName].filter(Boolean).join(" ")}
                </Text>
                {c.primaryDiagnosis ? (
                  <Text style={{ color: "#6b7280", marginTop: 2 }}>
                    {c.primaryDiagnosis}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setPickerOpen(false)}
              style={{
                marginTop: 8,
                alignSelf: "center",
                paddingVertical: 10,
                paddingHorizontal: 16,
              }}
            >
              <Text style={{ color: "#2563EB", fontWeight: "700" }}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
