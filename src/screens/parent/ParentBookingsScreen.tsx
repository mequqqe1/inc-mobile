// screens/parent/ParentBookingsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Modal } from "react-native";
import { myBookings, cancelBooking, Booking, BookingStatus, getOutcomeForParent, acknowledgeOutcome } from "../../api/bookings";
import { Child, listChildren } from "../../api/parent/children";

const PRIMARY = "#61A43B";

export default function ParentBookingsScreen() {
  const [list, setList] = useState<Booking[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  // outcome state
  const [outModalVisible, setOutModalVisible] = useState(false);
  const [outBusy, setOutBusy] = useState(false);
  const [outcome, setOutcome] = useState<{ summary: string; recommendations?: string|null; nextSteps?: string|null; createdAtUtc: string; parentAcknowledgedAtUtc?: string|null }|null>(null);

  const childMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of children) {
      const label = c.lastName ? `${c.firstName} ${c.lastName}` : c.firstName;
      m[c.id] = label;
    }
    return m;
  }, [children]);

  const load = async () => {
    setLoading(true);
    try {
      const [bookings, kids] = await Promise.all([myBookings(), listChildren().catch(()=>[] as Child[])]);
      setChildren(kids);
      setList(bookings.sort((a,b)=> +new Date(b.startsAtUtc) - +new Date(a.startsAtUtc)));
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось загрузить");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id: string) => {
    try {
      setBusy(id);
      await cancelBooking(id);
      await load();
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось отменить");
    } finally { setBusy(null); }
  };

  const openOutcome = async (id: string) => {
    try {
      setOutBusy(true);
      const o = await getOutcomeForParent(id);
      setOutcome({
        summary: o.summary,
        recommendations: o.recommendations,
        nextSteps: o.nextSteps,
        createdAtUtc: o.createdAtUtc,
        parentAcknowledgedAtUtc: o.parentAcknowledgedAtUtc ?? null
      });
      setOutModalVisible(true);
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Заключение ещё не готово");
    } finally { setOutBusy(false); }
  };

  const markRead = async (id: string) => {
    try {
      setOutBusy(true);
      await acknowledgeOutcome(id);
      setOutcome(o => o ? { ...o, parentAcknowledgedAtUtc: new Date().toISOString() } : o);
      Alert.alert("Спасибо", "Вы отметили заключение как прочитанное.");
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось отметить");
    } finally { setOutBusy(false); }
  };

  if (loading) return <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />;

  if (list.length === 0) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <Text style={{ color:"#7A8A83" }}>Пока нет записей</Text>
      </View>
    );
  }

  return (
    <View style={{ flex:1 }}>
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 28 }}>
        {list.map(b => {
          const status = statusPill(b.status);
          const date = new Date(b.startsAtUtc);
          const childLabel = b.childId ? childMap[b.childId] : undefined;
          return (
            <View key={b.id} style={s.card}>
              <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
                <Text style={s.title}>
                  {date.toLocaleDateString([], { day:"2-digit", month:"2-digit" })} • {date.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                </Text>
                <View style={[s.pill, { backgroundColor: status.bg }]}>
                  <Text style={{ color: status.text, fontWeight:"800", fontSize:12 }}>{status.textLabel}</Text>
                </View>
              </View>

              {!!childLabel && (
                <Text style={s.childLine}>Ребёнок: <Text style={{ fontWeight:"800", color:"#2B2F2C" }}>{childLabel}</Text></Text>
              )}
              {!!b.messageFromParent && <Text style={s.note}>“{b.messageFromParent}”</Text>}

              {(b.status === BookingStatus.Pending || b.status === BookingStatus.Confirmed) && (
                <TouchableOpacity onPress={() => cancel(b.id)} style={s.cancelBtn} disabled={busy===b.id}>
                  {busy===b.id ? <ActivityIndicator color="#fff" /> : <Text style={s.cancelTxt}>Отменить</Text>}
                </TouchableOpacity>
              )}

              {b.status === BookingStatus.Completed && (
                <TouchableOpacity
                  onPress={() => openOutcome(b.id)}
                  style={[s.cancelBtn, { backgroundColor: PRIMARY }]}
                  disabled={outBusy}
                >
                  {outBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.cancelTxt}>Посмотреть заключение</Text>}
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Outcome modal */}
      <Modal visible={outModalVisible} animationType="slide" transparent>
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.35)", justifyContent:"flex-end" }}>
          <View style={{ backgroundColor:"#fff", borderTopLeftRadius:16, borderTopRightRadius:16, padding:16, maxHeight:"85%" }}>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
              <Text style={{ fontWeight:"900", fontSize:18, color:"#2B2F2C" }}>Заключение</Text>
              <TouchableOpacity onPress={()=>setOutModalVisible(false)}><Text style={{ color:PRIMARY, fontWeight:"700" }}>Закрыть</Text></TouchableOpacity>
            </View>
            {!outcome ? (
              <ActivityIndicator color={PRIMARY} style={{ marginTop:16 }} />
            ) : (
              <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
                <Text style={{ color:"#2B2F2C", fontWeight:"800", marginTop:8 }}>Итог</Text>
                <Text style={{ color:"#46534E", marginTop:4 }}>{outcome.summary}</Text>

                {!!outcome.recommendations && (
                  <>
                    <Text style={{ color:"#2B2F2C", fontWeight:"800", marginTop:12 }}>Рекомендации</Text>
                    <Text style={{ color:"#46534E", marginTop:4 }}>{outcome.recommendations}</Text>
                  </>
                )}

                {!!outcome.nextSteps && (
                  <>
                    <Text style={{ color:"#2B2F2C", fontWeight:"800", marginTop:12 }}>Следующие шаги</Text>
                    <Text style={{ color:"#46534E", marginTop:4 }}>{outcome.nextSteps}</Text>
                  </>
                )}

                <Text style={{ color:"#7A8A83", marginTop:12, fontSize:12 }}>
                  Создано: {new Date(outcome.createdAtUtc).toLocaleString()}
                </Text>
                {outcome.parentAcknowledgedAtUtc ? (
                  <Text style={{ color:"#7A8A83", marginTop:4, fontSize:12 }}>
                    Отмечено как прочитанное: {new Date(outcome.parentAcknowledgedAtUtc).toLocaleString()}
                  </Text>
                ) : null}

                {!outcome.parentAcknowledgedAtUtc && (
                  <TouchableOpacity onPress={() => markRead(list.find(b=>b.status===BookingStatus.Completed && b.id)!.id)} style={[s.cancelBtn, { backgroundColor: PRIMARY, marginTop:16 }]}>
                    {outBusy ? <ActivityIndicator color="#fff" /> : <Text style={s.cancelTxt}>Я прочитал(а)</Text>}
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function statusPill(s: BookingStatus) {
  switch (s) {
    case BookingStatus.Pending: return { bg:"#FFF7D1", text:"#8A6D1A", textLabel:"Ожидает" };
    case BookingStatus.Confirmed: return { bg:"#E8F5E9", text:"#256029", textLabel:"Подтверждено" };
    case BookingStatus.Declined: return { bg:"#F3F4F6", text:"#6B7280", textLabel:"Отклонено" };
    case BookingStatus.CancelledByParent: return { bg:"#F3F4F6", text:"#6B7280", textLabel:"Отменено (вами)" };
    case BookingStatus.CancelledBySpecialist: return { bg:"#F3F4F6", text:"#6B7280", textLabel:"Отменено (спец.)" };
    case BookingStatus.Completed: return { bg:"#E8EAF6", text:"#1F2A44", textLabel:"Завершено" };
    default: return { bg:"#EEE", text:"#555", textLabel:String(s) };
  }
}

const s = StyleSheet.create({
  card: {
    backgroundColor:"#fff", borderRadius:16, padding:12, borderWidth:1, borderColor:"#E6EEE2",
    shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6, marginBottom: 10
  },
  title: { fontWeight:"900", color:"#2B2F2C" },
  childLine: { color:"#4D5A55", marginTop: 6 },
  note: { color:"#4D5A55", marginTop: 6 },
  pill: { paddingHorizontal:10, paddingVertical:4, borderRadius:999 },
  cancelBtn: { marginTop: 10, backgroundColor:"#F45B69", borderRadius:10, paddingVertical:10, alignItems:"center" },
  cancelTxt: { color:"#fff", fontWeight:"800" },
});
