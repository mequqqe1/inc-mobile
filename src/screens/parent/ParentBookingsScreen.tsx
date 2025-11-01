import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { myBookings, cancelBooking, Booking, BookingStatus } from "../../api/bookings";

const PRIMARY = "#61A43B";

export default function ParentBookingsScreen() {
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await myBookings();
      setList(data.sort((a,b)=> +new Date(b.startsAtUtc) - +new Date(a.startsAtUtc)));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id: string) => {
    try {
      setBusy(id);
      await cancelBooking(id);
      await load();
    } finally { setBusy(null); }
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
    <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 28 }}>
      {list.map(b => {
        const status = statusPill(b.status);
        const date = new Date(b.startsAtUtc);
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
            {!!b.messageFromParent && <Text style={s.note}>“{b.messageFromParent}”</Text>}
            {(b.status === BookingStatus.Pending || b.status === BookingStatus.Confirmed) && (
              <TouchableOpacity onPress={() => cancel(b.id)} style={s.cancelBtn} disabled={busy===b.id}>
                {busy===b.id ? <ActivityIndicator color="#fff" /> : <Text style={s.cancelTxt}>Отменить</Text>}
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

function statusPill(s: BookingStatus) {
  switch (s) {
    case BookingStatus.Pending: return { bg:"#FFF7D1", text:"#8A6D1A", textLabel:"Ожидает" };
    case BookingStatus.Confirmed: return { bg:"#E8F5E9", text:"#256029", textLabel:"Подтверждено" };
    case BookingStatus.Declined: return { bg:"#F3F4F6", text:"#6B7280", textLabel:"Отклонено" };
    case BookingStatus.CancelledByParent: return { bg:"#F3F4F6", text:"#6B7280", textLabel:"Отменено (вами)" };
    case BookingStatus.CancelledBySpecialist: return { bg:"#F3F4F6", text:"#6B7280", textLabel:"Отменено (спец.)" };
    default: return { bg:"#EEE", text:"#555", textLabel:String(s) };
  }
}

const s = StyleSheet.create({
  card: {
    backgroundColor:"#fff", borderRadius:16, padding:12, borderWidth:1, borderColor:"#E6EEE2",
    shadowColor:"#000", shadowOpacity:0.06, shadowRadius:6, marginBottom: 10
  },
  title: { fontWeight:"900", color:"#2B2F2C" },
  note: { color:"#4D5A55", marginTop: 6 },
  pill: { paddingHorizontal:10, paddingVertical:4, borderRadius:999 },
  cancelBtn: { marginTop: 10, backgroundColor:"#F45B69", borderRadius:10, paddingVertical:10, alignItems:"center" },
  cancelTxt: { color:"#fff", fontWeight:"800" },
});
