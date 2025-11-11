import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import { PrimaryButton, Card, Chip } from "../../components/Ui";
import {
  Child,
  createChild,
  getChild,
  updateChild,
  Sex,
  SupportLevel,
} from "../../api/parent/children";
import { useRoute, useNavigation } from "@react-navigation/native";

// =======================
// Вспомогательные UI-компоненты
// =======================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontWeight: "700", marginBottom: 8, color: colors.text }}>
      {children}
    </Text>
  );
}

function LabeledInput({
  label,
  hint,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  autoCapitalize = "sentences",
  keyboardType = "default",
  style,
}: {
  label: string;
  hint?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?:
    | "default"
    | "email-address"
    | "numeric"
    | "phone-pad"
    | "url"
    | "number-pad";
  style?: any;
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ fontWeight: "600", color: colors.text }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA2A0"
        style={[
          {
            borderWidth: 1,
            borderColor: "#E5E9E6",
            borderRadius: radius.lg,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginTop: 8,
            backgroundColor: "#fff",
            color: colors.text,
            textAlignVertical: multiline ? "top" : "center",
            minHeight: multiline ? 96 : undefined,
          },
          style,
        ]}
        multiline={multiline}
        autoCorrect={false}
        autoCapitalize={autoCapitalize}
        keyboardType={keyboardType}
        returnKeyType="done"
      />
      {hint ? (
        <Text style={{ marginTop: 6, color: colors.textMuted, fontSize: 12 }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

function SexChip({
  val,
  label,
  active,
  onSelect,
}: {
  val: Sex;
  label: string;
  active: boolean;
  onSelect: (v: Sex) => void;
}) {
  return (
    <Chip
      text={label}
      active={active}
      onPress={() => onSelect(val)}
      style={{ marginRight: 8, marginTop: 8 }}
    />
  );
}

function SLChip({
  val,
  label,
  active,
  onSelect,
}: {
  val: SupportLevel;
  label: string;
  active: boolean;
  onSelect: (v: SupportLevel) => void;
}) {
  return (
    <Chip
      text={label}
      active={active}
      onPress={() => onSelect(val)}
      style={{ marginRight: 8, marginTop: 8 }}
    />
  );
}

// =======================
// Основной экран
// =======================

export default function ChildFormScreen() {
  const { params } = useRoute<any>();
  const nav = useNavigation<any>();
  const id: string | undefined = params?.id;

  const [model, setModel] = useState<Partial<Child>>({ firstName: "" });
  const [loading, setLoading] = useState<boolean>(!!id);
  const isEdit = !!id;

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getChild(id);
        setModel(data);
      } catch (e: any) {
        Alert.alert("Ошибка", "Не удалось загрузить карточку");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const isoHint = `Формат ISO 8601 (UTC). Например: 2023-11-04T00:00:00Z.
Можно просто дату с полуночью в UTC.`;

  const canSave = useMemo(() => {
    return !!model.firstName?.trim() && !loading;
  }, [model.firstName, loading]);

  const validate = () => {
    if (!model.firstName?.trim()) {
      Alert.alert("Ошибка", "Имя обязательно");
      return false;
    }
    if (model.birthDate && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(model.birthDate)) {
      Alert.alert(
        "Неверная дата рождения",
        "Ожидается формат: 2023-11-04T00:00:00Z (UTC)"
      );
      return false;
    }
    return true;
  };

  const save = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      const payload: Partial<Child> = {
        ...model,
        firstName: model.firstName!.trim(),
      };
      if (isEdit) {
        await updateChild(id!, payload);
      } else {
        await createChild(payload as Child);
      }
      nav.goBack();
    } catch (e: any) {
      Alert.alert(
        "Ошибка",
        e?.response?.data?.error?.message || "Не удалось сохранить"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 12, color: colors.textMuted }}>
          Загрузка карточки…
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ОСНОВНОЕ */}
        <Card>
          <SectionTitle>Основное</SectionTitle>

          <LabeledInput
            label="Имя *"
            placeholder="Например: Артём"
            value={model.firstName || ""}
            onChangeText={(v) => setModel((m) => ({ ...m, firstName: v }))}
            autoCapitalize="words"
          />

          <LabeledInput
            label="Фамилия"
            placeholder="Опционально"
            value={model.lastName || ""}
            onChangeText={(v) => setModel((m) => ({ ...m, lastName: v }))}
            autoCapitalize="words"
          />

          <LabeledInput
            label="Дата рождения (UTC)"
            placeholder='Например: 2023-11-04T00:00:00Z'
            hint={isoHint}
            value={model.birthDate || ""}
            onChangeText={(v) => setModel((m) => ({ ...m, birthDate: v }))}
            autoCapitalize="none"
            keyboardType="default"
          />

          <Text style={{ marginTop: 14, color: colors.textMuted }}>Пол</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <SexChip
              val={0}
              label="Неизв."
              active={model.sex === 0 || model.sex === undefined}
              onSelect={(val) => setModel((m) => ({ ...m, sex: val }))}
            />
            <SexChip
              val={1}
              label="Мальчик"
              active={model.sex === 1}
              onSelect={(val) => setModel((m) => ({ ...m, sex: val }))}
            />
            <SexChip
              val={2}
              label="Девочка"
              active={model.sex === 2}
              onSelect={(val) => setModel((m) => ({ ...m, sex: val }))}
            />
          </View>

          <Text style={{ marginTop: 14, color: colors.textMuted }}>
            Уровень поддержки
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <SLChip
              val={0}
              label="Неизв."
              active={model.supportLevel === 0 || model.supportLevel === undefined}
              onSelect={(val) => setModel((m) => ({ ...m, supportLevel: val }))}
            />
            <SLChip
              val={1}
              label="Лёгкий"
              active={model.supportLevel === 1}
              onSelect={(val) => setModel((m) => ({ ...m, supportLevel: val }))}
            />
            <SLChip
              val={2}
              label="Средний"
              active={model.supportLevel === 2}
              onSelect={(val) => setModel((m) => ({ ...m, supportLevel: val }))}
            />
            <SLChip
              val={3}
              label="Высокий"
              active={model.supportLevel === 3}
              onSelect={(val) => setModel((m) => ({ ...m, supportLevel: val }))}
            />
          </View>
        </Card>

        {/* ДОП. ИНФОРМАЦИЯ */}
        <Card>
          <SectionTitle>Дополнительная информация</SectionTitle>

          <LabeledInput
            label="Диагноз"
            placeholder="Например: РАС, СДВГ…"
            value={model.primaryDiagnosis || ""}
            onChangeText={(v) =>
              setModel((m) => ({ ...m, primaryDiagnosis: v }))
            }
          />

          <LabeledInput
            label="Коммуникация"
            placeholder="Например: PECS, жесты, альтернативная коммуникация"
            hint="Опишите используемый способ общения."
            value={model.communicationMethod || ""}
            onChangeText={(v) =>
              setModel((m) => ({ ...m, communicationMethod: v }))
            }
          />

          <LabeledInput
            label="Аллергии"
            placeholder="Если есть — перечислите"
            value={model.allergies || ""}
            onChangeText={(v) => setModel((m) => ({ ...m, allergies: v }))}
          />

          <LabeledInput
            label="Медикаменты"
            placeholder="Название, дозировка, график"
            value={model.medications || ""}
            onChangeText={(v) => setModel((m) => ({ ...m, medications: v }))}
          />

          <LabeledInput
            label="Триггеры"
            placeholder="Что может вызвать стресс/поведение"
            value={model.triggers || ""}
            onChangeText={(v) => setModel((m) => ({ ...m, triggers: v }))}
          />

          <LabeledInput
            label="Стратегии успокоения"
            placeholder="Что помогает успокоиться"
            value={model.calmingStrategies || ""}
            onChangeText={(v) =>
              setModel((m) => ({ ...m, calmingStrategies: v }))
            }
          />

          <LabeledInput
            label="Школа / Центр"
            placeholder="Название учреждения"
            value={model.schoolOrCenter || ""}
            onChangeText={(v) =>
              setModel((m) => ({ ...m, schoolOrCenter: v }))
            }
          />

          <LabeledInput
            label="Текущие цели"
            placeholder="Кратко опишите цели на ближайшее время"
            value={model.currentGoals || ""}
            onChangeText={(v) => setModel((m) => ({ ...m, currentGoals: v }))}
            multiline
          />
        </Card>

        <PrimaryButton
          title={isEdit ? "Сохранить" : "Создать"}
          onPress={save}
          disabled={!canSave}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
