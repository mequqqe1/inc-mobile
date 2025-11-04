import React, { useEffect, useState } from "react";
import { View, Text, TextInput, ScrollView, Alert } from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import { PrimaryButton, Card, Chip } from "../../components/Ui";
import { Child, createChild, getChild, updateChild, Sex, SupportLevel } from "../../api/parent/children";
import { useRoute, useNavigation } from "@react-navigation/native";

export default function ChildFormScreen() {
  const { params } = useRoute<any>();
  const nav = useNavigation<any>();
  const id: string | undefined = params?.id;

  const [model, setModel] = useState<Partial<Child>>({ firstName: "" });
  const [loading, setLoading] = useState<boolean>(!!id);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      const data = await getChild(id);
      setModel(data);
      setLoading(false);
    })();
  }, [id]);

  const save = async () => {
    try {
      if (!model.firstName?.trim()) {
        Alert.alert("Ошибка", "Имя обязательно");
        return;
      }
      if (id) {
        await updateChild(id, model);
      } else {
        await createChild({ ...model, firstName: model.firstName!.trim() });
      }
      nav.goBack();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error?.message || "Не удалось сохранить");
    }
  };

  const SexChip = ({ val, label }: { val: Sex; label: string }) => (
    <Chip
      text={label}
      active={model.sex === val}
      onPress={() => setModel((m) => ({ ...m, sex: val }))}
      style={{ marginRight: 8, marginTop: 8 }}
    />
  );

  const SLChip = ({ val, label }: { val: SupportLevel; label: string }) => (
    <Chip
      text={label}
      active={model.supportLevel === val}
      onPress={() => setModel((m) => ({ ...m, supportLevel: val }))}
      style={{ marginRight: 8, marginTop: 8 }}
    />
  );

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Card>
        <Text style={{ fontWeight: "700", marginBottom: 8 }}>Основное</Text>
        <TextInput
          placeholder="Имя *"
          value={model.firstName || ""}
          onChangeText={(v) => setModel((m) => ({ ...m, firstName: v }))}
          style={input}
        />
        <TextInput
          placeholder="Фамилия"
          value={model.lastName || ""}
          onChangeText={(v) => setModel((m) => ({ ...m, lastName: v }))}
          style={input}
        />
        <TextInput
          placeholder='Дата рождения (UTC, напр. "2023-11-04T00:00:00Z")'
          value={model.birthDate || ""}
          onChangeText={(v) => setModel((m) => ({ ...m, birthDate: v }))}
          style={input}
          autoCapitalize="none"
        />

        <Text style={{ marginTop: 12, color: colors.textMuted }}>Пол</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <SexChip val={0} label="Неизв." />
          <SexChip val={1} label="Мальчик" />
          <SexChip val={2} label="Девочка" />
        </View>

        <Text style={{ marginTop: 12, color: colors.textMuted }}>Уровень поддержки</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          <SLChip val={0} label="Неизв." />
          <SLChip val={1} label="Лёгкий" />
          <SLChip val={2} label="Средний" />
          <SLChip val={3} label="Высокий" />
        </View>
      </Card>

      <Card>
        <TextInput placeholder="Диагноз" value={model.primaryDiagnosis || ""} onChangeText={(v)=>setModel(m=>({...m,primaryDiagnosis:v}))} style={input}/>
        <TextInput placeholder="Коммуникация (PECS, жесты…)" value={model.communicationMethod || ""} onChangeText={(v)=>setModel(m=>({...m,communicationMethod:v}))} style={input}/>
        <TextInput placeholder="Аллергии" value={model.allergies || ""} onChangeText={(v)=>setModel(m=>({...m,allergies:v}))} style={input}/>
        <TextInput placeholder="Медикаменты" value={model.medications || ""} onChangeText={(v)=>setModel(m=>({...m,medications:v}))} style={input}/>
        <TextInput placeholder="Триггеры" value={model.triggers || ""} onChangeText={(v)=>setModel(m=>({...m,triggers:v}))} style={input}/>
        <TextInput placeholder="Стратегии успокоения" value={model.calmingStrategies || ""} onChangeText={(v)=>setModel(m=>({...m,calmingStrategies:v}))} style={input}/>
        <TextInput placeholder="Школа/Центр" value={model.schoolOrCenter || ""} onChangeText={(v)=>setModel(m=>({...m,schoolOrCenter:v}))} style={input}/>
        <TextInput placeholder="Текущие цели" value={model.currentGoals || ""} onChangeText={(v)=>setModel(m=>({...m,currentGoals:v}))} style={[input,{height:96}]} multiline />
      </Card>

      <PrimaryButton title={id ? "Сохранить" : "Создать"} onPress={save} />
    </ScrollView>
  );
}

const input = {
  borderWidth: 1, borderColor: "#E5E9E6", borderRadius: radius.lg,
  paddingHorizontal: 12, paddingVertical: 10, marginTop: 8, backgroundColor: "#fff", color: colors.text
};
