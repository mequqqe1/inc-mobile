import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { Card, PrimaryButton } from "../../components/Ui";
import { Caregiver, listCaregivers, inviteCaregiver, updateCaregiver, removeCaregiver } from "../../api/parent/caregivers";
import { colors, radius } from "../../theme/AppTheme";

export default function CaregiversScreen() {
  const [items, setItems] = useState<Caregiver[]>([]);
  const [email, setEmail] = useState(""); const [relation, setRelation] = useState("");

  const load = async () => setItems(await listCaregivers());
  useEffect(() => { load(); }, []);

  const invite = async () => {
    if (!email.trim()) return;
    try {
      await inviteCaregiver(email.trim(), relation || "Член семьи", false);
      setEmail(""); setRelation(""); await load();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось пригласить");
    }
  };

  return (
    <View style={{ flex:1, padding:16 }}>
      <Card>
        <TextInput placeholder="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={input}/>
        <TextInput placeholder="Отношение (напр. Отец)" value={relation} onChangeText={setRelation} style={input}/>
        <PrimaryButton title="Пригласить" onPress={invite} />
      </Card>

      {items.map((m) => (
        <Card key={m.id} style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: "700" }}>{m.email}</Text>
          <Text style={{ color: colors.textMuted, marginTop: 4 }}>
            {m.relation || "—"} • {m.isAdmin ? "Админ" : "Участник"} • Статус: {["Pending","Active","Revoked"][m.status] || m.status}
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
            <PrimaryButton title={m.isAdmin ? "Сделать обычным" : "Сделать админом"}
              onPress={() => updateCaregiver(m.id, { isAdmin: !m.isAdmin }).then(load)} />
            <PrimaryButton title={m.status === 2 ? "Активировать" : "Отозвать"}
              onPress={() => updateCaregiver(m.id, { status: m.status === 2 ? 1 : 2 }).then(load)} />
            <PrimaryButton title="Удалить" onPress={() => removeCaregiver(m.id).then(load)} />
          </View>
        </Card>
      ))}
    </View>
  );
}

const input = {
  borderWidth: 1, borderColor: "#E5E9E6", borderRadius: radius.lg,
  paddingHorizontal: 12, paddingVertical: 10, marginTop: 8, backgroundColor: "#fff", color: colors.text
};
