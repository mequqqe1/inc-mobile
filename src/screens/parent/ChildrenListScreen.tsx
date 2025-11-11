import React, { useEffect, useState } from "react";
import { View, Text, FlatList, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { colors } from "../../theme/AppTheme";
import { Card, PrimaryButton } from "../../components/Ui";
import { Child, listChildren, deleteChild } from "../../api/parent/children";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function ChildrenListScreen() {
  const [items, setItems] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation<any>();

  const { logout } = useAuth();

  const load = async () => {
    setLoading(true);
    const data = await listChildren();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const onDelete = async (id: string) => {
    Alert.alert("Удалить", "Вы уверены?", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: async () => {
          await deleteChild(id);
          await load();
        }
      },
    ]);
  };

  const sexMap: Record<number, string> = { 1: "Мальчик", 2: "Девочка" };
  const supportMap: Record<number, string> = { 1: "Легкий", 2: "Средний", 3: "Высокий" };

  return (
    <View style={{ flex: 1, padding: 16, gap: 12 }}>
      <PrimaryButton title="logout" onPress={async () => {logout()}} />

      <PrimaryButton title="Добавить ребёнка" onPress={() => nav.navigate("ChildForm")} />

      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        renderItem={({ item }) => (
          <Card style={{ marginVertical: 6 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.text }}>
                  {item.firstName} {item.lastName || ""}
                </Text>
                {!!item.primaryDiagnosis && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.primaryDiagnosis}</Text>
                )}
                {!!item.birthDate && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.birthDate}</Text>
                )}
                {item.sex !== undefined && (
                  <Text style={{ color: colors.textMuted, marginTop: 4, flexShrink: 1, flexWrap: "wrap" }}>
                    Пол: {sexMap[item.sex] || "Неизв."}
                  </Text>
                )}
                {item.supportLevel !== undefined && (
                  <Text style={{ color: colors.textMuted, marginTop: 4, flexShrink: 1, flexWrap: "wrap" }}>
                    Уровень поддержки: {supportMap[item.supportLevel] || "Неизв."}
                  </Text>
                )}
                {!!item.communicationMethod && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.communicationMethod}</Text>
                )}
                {!!item.allergies && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.allergies}</Text>
                )}
                {!!item.medications && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.medications}</Text>
                )}
                {!!item.triggers && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.triggers}</Text>
                )}
                {!!item.calmingStrategies && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.calmingStrategies}</Text>
                )}
                {!!item.schoolOrCenter && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.schoolOrCenter}</Text>
                )}
                {!!item.currentGoals && (
                  <Text style={{ color: colors.textMuted, marginTop: 4 }} numberOfLines={2} ellipsizeMode="tail">{item.currentGoals}</Text>
                )}
              </View>
              <TouchableOpacity onPress={() => nav.navigate("ChildForm", { id: item.id })}>
                <Ionicons name="create-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nav.navigate("ChildNotes", { childId: item.id, name: item.firstName })} style={{ marginLeft: 12 }}>
                <Ionicons name="chatbubbles-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => nav.navigate("ChildDocs", { childId: item.id, name: item.firstName })} style={{ marginLeft: 12 }}>
                <Ionicons name="document-outline" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={{ marginLeft: 12 }}>
                <Ionicons name="trash-outline" size={22} color={"#D33"} />
              </TouchableOpacity>
              
            </View>
          </Card>
        )}
        ListEmptyComponent={
          !loading ? <Text style={{ color: colors.textMuted, textAlign: "center", marginTop: 24 }}>
            Пока пусто — добавьте ребёнка
          </Text> : null
        }
      />
    </View>
  );
}
