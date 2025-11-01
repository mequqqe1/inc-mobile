import React, { useEffect, useState, useCallback } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, PrimaryButton, Chip } from "../../components/Ui";
import { ActivityIndicator, FlatList, Text, View, Alert, RefreshControl } from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import { BookingStatus, Booking, incomingBookings, confirmBooking, declineBooking } from "../../api/bookings";

const tabs: Array<{ key: "All" | BookingStatus; label: string }> = [
  { key: "All", label: "Все" },
  { key: BookingStatus.Pending, label: "Ожидают" },
  { key: BookingStatus.Confirmed, label: "Приняты" },
  { key: BookingStatus.Declined, label: "Отклонены" },
];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
}

export default function BookingsScreen() {
  const [filter, setFilter] = useState<"All" | BookingStatus>("All");
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await incomingBookings(filter === "All" ? undefined : filter);
      // сортируем: сначала Pending, потом Confirmed, потом Declined, по дате
      const order = (s: BookingStatus) => ({0:0,1:1,2:2,3:3,4:4} as any)[s] ?? 9;
      setList(
        data.slice().sort((a,b) => {
          const o = order(a.status) - order(b.status);
          return o !== 0 ? o : +new Date(a.startsAtUtc) - +new Date(b.startsAtUtc);
        })
      );
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось загрузить брони");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const onConfirm = async (id: string) => {
    try {
      setBusyId(id);
      await confirmBooking(id);
      await load();
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось подтвердить");
    } finally { setBusyId(null); }
  };
  const onDecline = async (id: string) => {
    try {
      setBusyId(id);
      await declineBooking(id);
      await load();
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось отклонить");
    } finally { setBusyId(null); }
  };

  const statusPill = (s: BookingStatus) => {
    const map: Record<number, {bg:string; text:string; label:string}> = {
      [BookingStatus.Pending]:   { bg:"#FFF8E1", text:"#8A6D1A", label:"Ожидает" },
      [BookingStatus.Confirmed]: { bg:"#E8F5E9", text:"#256029", label:"Принята" },
      [BookingStatus.Declined]:  { bg:"#F3F4F6", text:"#6B7280", label:"Отклонена" },
      [BookingStatus.CancelledByParent]: { bg:"#F3F4F6", text:"#6B7280", label:"Отмена (род.)" },
      [BookingStatus.CancelledBySpecialist]: { bg:"#F3F4F6", text:"#6B7280", label:"Отмена (спец.)" },
    };
    const p = map[s] ?? { bg:"#EEE", text:"#555", label:String(s) };
    return (
      <View style={{ backgroundColor:p.bg, paddingVertical:4, paddingHorizontal:8, borderRadius:12 }}>
        <Text style={{ color:p.text, fontWeight:"700", fontSize:12 }}>{p.label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const day = fmtDay(item.startsAtUtc);
    const time = `${fmtTime(item.startsAtUtc)}–${fmtTime(item.endsAtUtc)}`;
    return (
      <View style={{
        borderWidth:1, borderColor:"#E1E7DF", backgroundColor:"#fff",
        borderRadius: radius.lg, padding:12
      }}>
        <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center" }}>
          <Text style={{ fontWeight:"800", color: colors.text }}>{day}</Text>
          {statusPill(item.status)}
        </View>
        <Text style={{ color: colors.textMuted, marginTop:2 }}>{time}</Text>
        {/* parentUserId у тебя есть — если потребуется, можно подтянуть профиль/имя отдельным запросом */}
        <Text style={{ color: colors.textMuted, marginTop:6, fontSize:12 }}>Parent: {item.parentUserId}</Text>

        {item.status === BookingStatus.Pending && (
          <View style={{ flexDirection:"row", gap:10, marginTop:10 }}>
            <PrimaryButton
              title={busyId===item.id ? "..." : "✅ Принять"}
              onPress={() => onConfirm(item.id)}
              style={{ flex:1 }}
            />
            <PrimaryButton
              title={busyId===item.id ? "..." : "❌ Отклонить"}
              onPress={() => onDecline(item.id)}
              style={{ flex:1, backgroundColor:"#F45B69" }}
            />
          </View>
        )}
      </View>
    );
  };

  return (
    <Container>
      <Header title="Брони" subtitle="Заявки на ваши слоты" />

      <Card>
        <View style={{ flexDirection:"row", gap:8, flexWrap:"wrap", marginBottom: 8 }}>
          {tabs.map(t => (
            <Chip key={String(t.key)} text={t.label} active={filter===t.key} onPress={()=>setFilter(t.key)} />
          ))}
        </View>

        {loading ? (
          <ActivityIndicator />
        ) : list.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>Нет броней по выбранному фильтру.</Text>
        ) : (
          <FlatList
            data={list}
            keyExtractor={(i)=>i.id}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{ setRefreshing(true); load(); }} />}
          />
        )}
      </Card>
    </Container>
  );
}
