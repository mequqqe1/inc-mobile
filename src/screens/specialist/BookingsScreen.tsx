// screens/specialist/BookingsScreen.tsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, PrimaryButton, Chip } from "../../components/Ui";
import {
  ActivityIndicator, FlatList, Text, View, Alert, RefreshControl,
  Modal, TextInput, TouchableOpacity, ScrollView
} from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import {
  BookingStatus, Booking, incomingBookings, confirmBooking, declineBooking,
  closeBooking
} from "../../api/bookings";
import * as bookingsApi from "../../api/bookings";
console.log("bookingsApi keys:", Object.keys(bookingsApi));
console.log("typeof bookingsApi.closeBooking:", typeof bookingsApi.closeBooking);


const tabs: Array<{ key: "All" | BookingStatus; label: string }> = [
  { key: "All", label: "Все" },
  { key: BookingStatus.Pending, label: "Ожидают" },
  { key: BookingStatus.Confirmed, label: "Приняты" },
  { key: BookingStatus.Declined, label: "Отклонены" },
  { key: BookingStatus.Completed, label: "Завершены" }, // NEW
];

function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }
function fmtDay(iso: string) { return new Date(iso).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" }); }

async function fetchParentBrief(userId: string): Promise<{ id: string; fullName: string }> {
  // Пока нет API — просто возвращаем userId как имя
  return { id: userId, fullName: userId };
}

export default function BookingsScreen() {
  const [filter, setFilter] = useState<"All" | BookingStatus>("All");
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [parentsMap, setParentsMap] = useState<Record<string, string>>({});

  // close modal state
  const [closeVisible, setCloseVisible] = useState(false);
  const [closeBookingId, setCloseBookingId] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [recs, setRecs] = useState("");
  const [next, setNext] = useState("");
  const [priv, setPriv] = useState("");
  const [closeBusy, setCloseBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await incomingBookings(filter === "All" ? undefined : filter);
      const order = (s: BookingStatus) => ({0:0,1:1,2:2,3:3,4:4,5:5} as any)[s] ?? 9;
      const sorted = data.slice().sort((a,b) => {
        const o = order(a.status) - order(b.status);
        return o !== 0 ? o : +new Date(a.startsAtUtc) - +new Date(b.startsAtUtc);
      });
      setList(sorted);

      // preload parent names
      const ids = Array.from(new Set(sorted.map(b => b.parentUserId)));
      const missing = ids.filter(id => !parentsMap[id]);
      if (missing.length) {
        const res = await Promise.allSettled(missing.map(fetchParentBrief));
        const patch: Record<string, string> = {};
        res.forEach(r => { if (r.status==="fulfilled") patch[r.value.id] = r.value.fullName; });
        if (Object.keys(patch).length) setParentsMap(p => ({...p, ...patch}));
      }
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось загрузить брони");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [filter, parentsMap]);

  useEffect(() => { load(); }, [load]);

  const onConfirm = async (id: string) => {
    try { setBusyId(id); await confirmBooking(id); await load(); }
    catch (e:any) { Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось подтвердить"); }
    finally { setBusyId(null); }
  };
  const onDecline = async (id: string) => {
    try { setBusyId(id); await declineBooking(id); await load(); }
    catch (e:any) { Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось отклонить"); }
    finally { setBusyId(null); }
  };

  const openCloseModal = (id: string) => {
    setCloseBookingId(id);
    setSummary(""); setRecs(""); setNext(""); setPriv("");
    setCloseVisible(true);
  };
const submitClose = async () => {
  try {
    console.log("[submitClose] click", { closeBookingId, summary, recs, next, priv });
    if (!closeBookingId) { 
      Alert.alert("Ошибка", "Не выбран визит (closeBookingId отсутствует).");
      return; 
    }
    if (!summary.trim()) {
      Alert.alert("Заполните итог", "Поле «Итог (summary)» обязательно.");
      return;
    }

    setCloseBusy(true);

    const payload = {
      summary: summary.trim(),
      recommendations: recs.trim() || undefined,
      nextSteps: next.trim() || undefined,
      specialistPrivateNotes: priv.trim() || undefined
    };
    console.log("[submitClose] posting payload", payload);

    await closeBooking(closeBookingId, payload);

    console.log("[submitClose] success");
    setCloseVisible(false);
    await load();
    Alert.alert("Готово", "Визит завершён, заключение сохранено.");
  } catch (e: any) {
    console.log("[submitClose] error", e?.response?.data ?? e?.message ?? e);
    Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось закрыть визит");
  } finally {
    setCloseBusy(false);
  }
};


  const statusPill = (s: BookingStatus) => {
    const map: Record<number, { bg: string; text: string; label: string }> = {
      [BookingStatus.Pending]: { bg: "#FFF8E1", text: "#8A6D1A", label: "Ожидает" },
      [BookingStatus.Confirmed]: { bg: "#E8F5E9", text: "#256029", label: "Принята" },
      [BookingStatus.Declined]: { bg: "#F3F4F6", text: "#6B7280", label: "Отклонена" },
      [BookingStatus.CancelledByParent]: { bg: "#F3F4F6", text: "#6B7280", label: "Отмена (род.)" },
      [BookingStatus.CancelledBySpecialist]: { bg: "#F3F4F6", text: "#6B7280", label: "Отмена (спец.)" },
      [BookingStatus.Completed]: { bg: "#E8EAF6", text: "#1F2A44", label: "Завершена" }, // NEW
    };
    const p = map[s] ?? { bg: "#EEE", text: "#555", label: String(s) };
    return (
      <View style={{ backgroundColor: p.bg, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 12 }}>
        <Text style={{ color: p.text, fontWeight: "700", fontSize: 12 }}>{p.label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const day = fmtDay(item.startsAtUtc);
    const time = `${fmtTime(item.startsAtUtc)}–${fmtTime(item.endsAtUtc)}`;
    const parentName = parentsMap[item.parentUserId] || item.parentUserId;

    return (
      <View style={{ borderWidth:1, borderColor:"#E1E7DF", backgroundColor:"#fff", borderRadius: radius.lg, padding:12 }}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <Text style={{ fontWeight:"800", color: colors.text }}>{day}</Text>
          {statusPill(item.status)}
        </View>
        <Text style={{ color: colors.textMuted, marginTop:2 }}>{time}</Text>

        <Text style={{ color: colors.text, marginTop: 8, fontWeight: "700" }}>Родитель</Text>
        <Text style={{ color: colors.textMuted }}>{parentName}</Text>

        {!!item.messageFromParent && (
          <>
            <Text style={{ color: colors.text, marginTop: 8, fontWeight: "700" }}>Сообщение</Text>
            <Text style={{ color: colors.textMuted }}>{item.messageFromParent}</Text>
          </>
        )}

        {item.status === BookingStatus.Pending && (
          <View style={{ flexDirection:"row", gap:10, marginTop:12 }}>
            <PrimaryButton title={busyId===item.id ? "..." : "Принять"} onPress={() => onConfirm(item.id)} style={{ flex:1 }} />
            <PrimaryButton title={busyId===item.id ? "..." : "Отклонить"} onPress={() => onDecline(item.id)} style={{ flex:1, backgroundColor:"#F45B69" }} />
          </View>
        )}

        {item.status === BookingStatus.Confirmed && (
          <View style={{ marginTop:12 }}>
            <PrimaryButton title="Закрыть визит" onPress={() => openCloseModal(item.id)} />
          </View>
        )}
      </View>
    );
  };

  const refreshControl = useMemo(
    () => <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />,
    [refreshing, load]
  );

  return (
    <Container>
      <Header title="Брони" subtitle="Заявки на ваши слоты" />
      <Card>
        <View style={{ flexDirection:"row", gap:8, flexWrap:"wrap", marginBottom:8 }}>
          {tabs.map(t => <Chip key={String(t.key)} text={t.label} active={filter===t.key} onPress={()=>setFilter(t.key)} />)}
        </View>

        {loading ? <ActivityIndicator/> : list.length===0 ? (
          <Text style={{ color: colors.textMuted }}>Нет броней по выбранному фильтру.</Text>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(i)=>i.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            refreshControl={refreshControl}
          />
        )}
      </Card>

      {/* Close modal */}
      <Modal visible={closeVisible} animationType="slide" transparent>
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.3)", justifyContent:"flex-end" }}>
          <View style={{ backgroundColor:"#fff", borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, maxHeight:"85%" }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <Text style={{ fontWeight:"900", fontSize:18, color:colors.text }}>Закрытие визита</Text>
              <TouchableOpacity onPress={()=>setCloseVisible(false)}><Text style={{ color:"#61A43B", fontWeight:"700" }}>Закрыть</Text></TouchableOpacity>
            </View>
            <ScrollView>
              <Text style={{ fontWeight:"700", color:colors.text, marginTop:6 }}>Итог (обязательно)</Text>
              <TextInput value={summary} onChangeText={setSummary} placeholder="Краткое заключение..." multiline
                style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:12, padding:10, minHeight:80, textAlignVertical:"top", marginTop:6 }} />

              <Text style={{ fontWeight:"700", color:colors.text, marginTop:12 }}>Рекомендации</Text>
              <TextInput value={recs} onChangeText={setRecs} placeholder="Рекомендации родителям…" multiline
                style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:12, padding:10, minHeight:70, textAlignVertical:"top", marginTop:6 }} />

              <Text style={{ fontWeight:"700", color:colors.text, marginTop:12 }}>Следующие шаги</Text>
              <TextInput value={next} onChangeText={setNext} placeholder="Домашнее задание / план…" multiline
                style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:12, padding:10, minHeight:60, textAlignVertical:"top", marginTop:6 }} />

              <Text style={{ fontWeight:"700", color:colors.text, marginTop:12 }}>Приватные заметки (только для вас)</Text>
              <TextInput value={priv} onChangeText={setPriv} placeholder="Видно только специалисту…" multiline
                style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:12, padding:10, minHeight:60, textAlignVertical:"top", marginTop:6 }} />

              <View style={{ marginTop:16 }}>
                <PrimaryButton title={closeBusy ? "Сохраняю..." : "Сохранить и завершить"} onPress={submitClose} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Container>
  );
}
