import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, FlatList, TouchableOpacity, Modal,
  ScrollView, ActivityIndicator, StyleSheet
} from "react-native";
import {
  getSpecialists, SpecialistCatalogItem,
  getSpecialistProfile, getAvailability
} from "../../api/specialist"
import { createBooking } from "../../api/bookings";

const PRIMARY = "#61A43B";

export default function ParentCatalogScreen() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<SpecialistCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SpecialistCatalogItem | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSpecialists();
        setList(res);
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = q.trim()
    ? list.filter(x =>
        (x.fullName ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (x.about ?? "").toLowerCase().includes(q.toLowerCase()) ||
        (x.city ?? "").toLowerCase().includes(q.toLowerCase()))
    : list;

  return (
    <View style={s.container}>
      <View style={s.searchBox}>
        <TextInput
          value={q} onChangeText={setQ} placeholder="Поиск по имени, городу, описанию"
          style={s.searchInput} placeholderTextColor="#93A29B"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.userId}
          contentContainerStyle={{ padding: 12, paddingBottom: 20 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} activeOpacity={0.9} onPress={() => setSelected(item)}>
              <View style={s.row}>
                <View style={s.avatarStub}>
                  <Text style={{ color:"#fff", fontWeight:"800" }}>
                    {(item.fullName||"?").slice(0,1).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.fullName}</Text>
                  <Text style={s.city}>{item.city}</Text>
                  {!!item.about && <Text style={s.about} numberOfLines={2}>{item.about}</Text>}
                  {!!item.specializations?.length && (
                    <Text style={s.tags} numberOfLines={1}>
                      {item.specializations.join(" • ")}
                    </Text>
                  )}
                </View>
                <View style={s.priceBadge}>
                  <Text style={s.priceText}>
                    {item.pricePerHour ? `${item.pricePerHour} ₸/ч` : "—"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {selected && (
        <SpecialistModal specialist={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

function SpecialistModal({
  specialist, onClose
}: { specialist: SpecialistCatalogItem; onClose: () => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingBusy, setBookingBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const d = await getSpecialistProfile(specialist.userId);
      setProfile(d);
      setLoading(false);
    })();
  }, []);

  const loadSlots = async () => {
    const fromUtc = new Date().toISOString();
    const toUtc = new Date(Date.now() + 7*24*3600*1000).toISOString();
    const data = await getAvailability(specialist.userId, fromUtc, toUtc);
    setSlots(data);
  };

  const doBook = async (slotId: string) => {
    try {
      setBookingBusy(slotId);
      await createBooking(slotId);
      alert("Заявка отправлена! Ожидайте подтверждения.");
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Не удалось создать бронь");
    } finally {
      setBookingBusy(null);
    }
  };

  return (
    <Modal visible animationType="slide">
      <View style={{ flex:1, backgroundColor:"#fff" }}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: PRIMARY, fontWeight:"700" }}>← Назад</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>Профиль специалиста</Text>
          <View style={{ width: 48 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <Text style={s.nameBig}>{profile.fullName}</Text>
            <Text style={s.city}>{profile.city}</Text>
            {!!profile.about && <Text style={s.aboutBig}>{profile.about}</Text>}

            {!!profile.specializations?.length && (
              <>
                <Text style={s.sectionTitle}>Специализации</Text>
                <Text style={s.tags}>{profile.specializations.join(" • ")}</Text>
              </>
            )}
            {!!profile.skills?.length && (
              <>
                <Text style={s.sectionTitle}>Навыки</Text>
                <Text style={s.tags}>{profile.skills.join(" • ")}</Text>
              </>
            )}

            <TouchableOpacity onPress={loadSlots} style={[s.button, { marginTop: 12 }]}>
              <Text style={s.buttonText}>Показать свободные слоты</Text>
            </TouchableOpacity>

            {slots.length > 0 && (
              <>
                <Text style={[s.sectionTitle, { marginTop: 12 }]}>Ближайшие 7 дней</Text>
                {slots.map((sl) => (
                  <View key={sl.id} style={s.slotRow}>
                    <Text style={s.slotText}>
                      {new Date(sl.startsAtUtc).toLocaleString([], { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                      {"  —  "}
                      {new Date(sl.endsAtUtc).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
                    </Text>
                    <TouchableOpacity onPress={() => doBook(sl.id)} style={s.slotBtn} disabled={bookingBusy === sl.id}>
                      {bookingBusy === sl.id ? <ActivityIndicator color="#fff" /> : <Text style={s.slotBtnTxt}>Записаться</Text>}
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF6" },
  searchBox: { paddingHorizontal: 12, paddingTop: 12 },
  searchInput: {
    backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: "#E1E7DF"
  },
  card: {
    backgroundColor:"#fff", borderRadius:16, padding:12,
    borderWidth:1, borderColor:"#E6EEE2",
    shadowColor:"#000", shadowOpacity:0.06, shadowOffset:{ width:0, height:2 }, shadowRadius:6,
  },
  row: { flexDirection:"row", gap:12, alignItems:"flex-start" },
  avatarStub: {
    width:48, height:48, borderRadius:24, backgroundColor:"#CFE7C4", alignItems:"center", justifyContent:"center"
  },
  name: { fontWeight:"800", fontSize:16, color:"#2B2F2C" },
  city: { color:"#7A8A83", marginTop:2 },
  about: { color:"#46534E", marginTop:4 },
  tags: { color:"#50645B", marginTop:2 },
  priceBadge: {
    alignSelf:"flex-start", backgroundColor:"#E8F2E5", borderRadius:10, paddingHorizontal:10, paddingVertical:6
  },
  priceText: { color: PRIMARY, fontWeight:"800" },
  modalHeader: {
    height: 54, borderBottomWidth:1, borderBottomColor:"#EAEFE8",
    paddingHorizontal:12, flexDirection:"row", alignItems:"center", justifyContent:"space-between"
  },
  modalTitle: { fontWeight:"800", color:"#2B2F2C" },
  nameBig: { fontWeight:"900", fontSize:20, color:"#2B2F2C" },
  aboutBig: { color:"#46534E", marginTop:6 },
  sectionTitle: { marginTop:10, fontWeight:"800", color:"#2B2F2C" },
  button: { backgroundColor: PRIMARY, borderRadius:12, alignItems:"center", paddingVertical:12 },
  buttonText: { color:"#fff", fontWeight:"800" },
  slotRow: {
    marginTop:8, padding:10, borderRadius:12, backgroundColor:"#fff", borderWidth:1, borderColor:"#E6EEE2",
    flexDirection:"row", alignItems:"center", justifyContent:"space-between"
  },
  slotText: { color:"#2B2F2C" },
  slotBtn: { backgroundColor: PRIMARY, borderRadius:10, paddingVertical:8, paddingHorizontal:12 },
  slotBtnTxt: { color:"#fff", fontWeight:"700" },
});
