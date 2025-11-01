import React, { useEffect, useMemo, useState } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, PrimaryButton, Chip } from "../../components/Ui";
import { View, Text, Alert, ActivityIndicator, Pressable } from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import { getPresets, generateFromPreset, materializeTemplate, mySlots, deleteSlot, AvailabilitySlot } from "../../api/schedule";
import { addDays, startOfDayUtc, toIso, formatHm, formatWeekday } from "../../utils/date";

type Preset = { code: string; name: string; slotMinutes: number };

export default function ScheduleWizardScreen() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [sel, setSel] = useState<string>("weekdays_10_18");
  const [busy, setBusy] = useState(false);

  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  // подгружаем пресеты и слоты на ближайшую неделю
  useEffect(() => {
    (async () => {
      try {
        const list = await getPresets();
        setPresets(list);
      } catch {}
      await reloadWeek();
    })();
  }, []);

  const reloadWeek = async () => {
    setLoadingSlots(true);
    try {
      const from = startOfDayUtc();
      const to = addDays(from, 7);
      const data = await mySlots(toIso(from), toIso(to));
      setSlots(data);
    } finally {
      setLoadingSlots(false);
    }
  };

  const createByPreset = async () => {
    try {
      setBusy(true);
      // минимальная логика параметров по нашему набору
      const days = sel === "weekends_10_16" ? [6,0] : [1,2,3,4,5];
      const start = sel === "evenings_18_21" ? "18:00:00" : "10:00:00";
      const end   = sel === "evenings_18_21" ? "21:00:00" : (sel === "weekends_10_16" ? "16:00:00" : "18:00:00");
      const breaks = sel === "weekdays_10_18" ? [{ from:"13:00:00", to:"14:00:00" }] : [];

      await generateFromPreset({
        presetCode: sel,
        daysOfWeek: days,
        startLocalTime: start,
        endLocalTime: end,
        slotMinutes: 30,
        breaks,
        note: "онлайн",
        isActive: true
      });

      // материализуем на 4 недели вперёд
      const from = startOfDayUtc();
      const to = addDays(from, 28);
      const res = await materializeTemplate(toIso(from), toIso(to), true);
      Alert.alert("Готово", `Создано слотов: ${res.created}`);
      await reloadWeek();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не получилось применить шаблон");
    } finally {
      setBusy(false);
    }
  };

  // группировка слотов по дню
  const grouped = useMemo(() => {
    const map: Record<string, AvailabilitySlot[]> = {};
    for (const s of slots) {
      const d = new Date(s.startsAtUtc);
      const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
      map[key] ??= [];
      map[key].push(s);
    }
    Object.values(map).forEach(arr => arr.sort((a,b)=>+new Date(a.startsAtUtc)-+new Date(b.startsAtUtc)));
    // отсортируем дни
    return Object.entries(map)
      .sort((a,b)=>+new Date(a[0]) - +new Date(b[0]))
      .map(([key, arr]) => ({ date: new Date(key), slots: arr }));
  }, [slots]);

  const onDeleteFree = async (slotId: string) => {
    try {
      setBusy(true);
      await deleteSlot(slotId);
      setSlots(prev => prev.filter(x => x.id !== slotId));
    } catch (e:any) {
      Alert.alert("Нельзя удалить", e?.response?.data?.error ?? "Слот удалён/забронирован");
    } finally { setBusy(false); }
  };

  return (
    <Container>
      <Header title="Расписание" subtitle="Пресеты и ближайшая неделя" />

      {/* блок пресетов */}
      <Card>
        <Text style={{ fontWeight:"800", fontSize:16, color: colors.text, marginBottom: 8 }}>Пресеты</Text>
        <View style={{ flexDirection:"row", gap:8, flexWrap:"wrap" }}>
          {presets.map(p => (
            <Chip
              key={p.code}
              text={p.name}
              active={sel===p.code}
              onPress={() => setSel(p.code)}
            />
          ))}
        </View>
        <PrimaryButton
          title={busy ? "Применяем..." : "Применить и создать слоты на 4 недели"}
          onPress={createByPreset}
          style={{ marginTop: 12 }}
        />
      </Card>

      {/* превью недели */}
      <Card>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom: 8 }}>
          <Text style={{ fontWeight:"800", fontSize:16, color: colors.text }}>Ближайшие 7 дней</Text>
          <Text onPress={reloadWeek} style={{ color: colors.primary, fontWeight:"700" }}>Обновить</Text>
        </View>

        {loadingSlots ? (
          <ActivityIndicator />
        ) : grouped.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>Пока нет слотов. Примените пресет.</Text>
        ) : (
          grouped.map(group => (
            <View key={group.date.toISOString()} style={{ marginBottom: 10 }}>
              <Text style={{ color: colors.textMuted, marginBottom: 6 }}>{formatWeekday(group.date)}</Text>
              <View style={{ flexDirection:"row", flexWrap:"wrap", gap:8 }}>
                {group.slots.map(s => (
                  <Pressable
                    key={s.id}
                    onLongPress={() => !s.isBooked && onDeleteFree(s.id)}
                    style={{
                      paddingVertical: 8, paddingHorizontal: 12,
                      borderWidth:1,
                      borderColor: s.isBooked ? "#D8D8D8" : colors.stroke,
                      backgroundColor: s.isBooked ? "#F0F0F0" : "#fff",
                      borderRadius: radius.md
                    }}
                  >
                    <Text style={{ fontWeight:"700", color: s.isBooked ? colors.textMuted : colors.text }}>
                      {formatHm(s.startsAtUtc)}–{formatHm(s.endsAtUtc)}
                    </Text>
                    <Text style={{ fontSize:12, color: s.isBooked ? colors.textMuted : colors.primary }}>
                      {s.isBooked ? "Занят" : "Свободно"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={{ color: colors.textMuted, fontSize:12, marginTop:6 }}>
                Долгое нажатие по свободному слоту — удалить
              </Text>
            </View>
          ))
        )}
      </Card>
    </Container>
  );
}
