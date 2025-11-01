import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { getSpecialists, SpecialistCatalogItem, getSpecialistProfile, getAvailability } from "../../api/specialist"
import { createBooking, myBookings, cancelBooking, Booking } from "../../api/bookings";

const PRIMARY = "#61A43B";

export default function ParentHomeScreen() {
  const [tab, setTab] = useState<"specialists" | "bookings">("specialists");

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setTab("specialists")} style={[styles.tab, tab === "specialists" && styles.activeTab]}>
          <Text style={[styles.tabText, tab === "specialists" && styles.activeTabText]}>Специалисты</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("bookings")} style={[styles.tab, tab === "bookings" && styles.activeTab]}>
          <Text style={[styles.tabText, tab === "bookings" && styles.activeTabText]}>Мои записи</Text>
        </TouchableOpacity>
      </View>

      {tab === "specialists" ? <SpecialistsTab /> : <BookingsTab />}
    </View>
  );
}

// === СПИСОК СПЕЦОВ ===
function SpecialistsTab() {
  const [list, setList] = useState<SpecialistCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SpecialistCatalogItem | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getSpecialists();
        setList(res);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={PRIMARY} />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={list}
        keyExtractor={(i) => i.userId}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelected(item)}>
            <Text style={styles.name}>{item.fullName}</Text>
            <Text style={styles.city}>{item.city}</Text>
            <Text numberOfLines={2} style={styles.about}>{item.about}</Text>
            <Text style={styles.price}>{item.pricePerHour ? `${item.pricePerHour} ₸/час` : "Цена не указана"}</Text>
          </TouchableOpacity>
        )}
      />

      {selected && <SpecialistModal specialist={selected} onClose={() => setSelected(null)} />}
    </View>
  );
}

// === МОДАЛКА СПЕЦИАЛИСТА ===
function SpecialistModal({ specialist, onClose }: { specialist: SpecialistCatalogItem; onClose: () => void }) {
  const [details, setDetails] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await getSpecialistProfile(specialist.userId);
      setDetails(data);
      setLoading(false);
    })();
  }, []);

  const loadSlots = async () => {
    const fromUtc = new Date().toISOString();
    const toUtc = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const data = await getAvailability(specialist.userId, fromUtc, toUtc);
    setSlots(data);
  };

  if (loading) return null;

  return (
    <Modal visible animationType="slide">
      <View style={{ flex: 1, padding: 20 }}>
        <TouchableOpacity onPress={onClose}><Text style={{ color: PRIMARY, fontWeight: "600" }}>← Назад</Text></TouchableOpacity>
        <ScrollView>
          <Text style={styles.nameLarge}>{details.fullName}</Text>
          <Text style={styles.city}>{details.city}</Text>
          <Text style={styles.about}>{details.about}</Text>
          <Text style={styles.sectionTitle}>Специализации:</Text>
          <Text>{details.specializations.join(", ")}</Text>
          <Text style={styles.sectionTitle}>Навыки:</Text>
          <Text>{details.skills.join(", ")}</Text>

          <TouchableOpacity onPress={loadSlots} style={styles.button}>
            <Text style={styles.buttonText}>Показать свободные слоты</Text>
          </TouchableOpacity>

          {slots.map((s) => (
            <TouchableOpacity key={s.id} style={styles.slot} onPress={() => { setSelectedSlot(s); setShowBooking(true); }}>
              <Text>{new Date(s.startsAtUtc).toLocaleString()} - {new Date(s.endsAtUtc).toLocaleTimeString()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showBooking && (
          <BookingModal
            slot={selectedSlot}
            specialistId={specialist.userId}
            onClose={() => setShowBooking(false)}
          />
        )}
      </View>
    </Modal>
  );
}

// === МОДАЛКА БРОНИ ===
function BookingModal({ slot, specialistId, onClose }: { slot: any; specialistId: string; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    setLoading(true);
    try {
      await createBooking(slot.id, message);
      alert("Бронирование отправлено!");
      onClose();
    } catch (e: any) {
      alert(e?.response?.data?.error || "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={{ fontSize: 16, fontWeight: "600" }}>Подтверждение записи</Text>
          <Text style={{ marginVertical: 10 }}>
            {new Date(slot.startsAtUtc).toLocaleString()} — {new Date(slot.endsAtUtc).toLocaleTimeString()}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Сообщение для специалиста"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity onPress={handleBook} style={[styles.button, { marginTop: 10 }]}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Подтвердить</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}><Text style={{ color: "gray", marginTop: 10 }}>Отмена</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// === ВКЛАДКА МОИ БРОНИ ===
function BookingsTab() {
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await myBookings();
      setList(res);
      setLoading(false);
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={PRIMARY} />;

  return (
    <ScrollView style={{ padding: 16 }}>
      {list.length === 0 && <Text style={{ textAlign: "center", color: "gray" }}>Нет записей</Text>}
      {list.map((b) => (
        <View key={b.id} style={styles.card}>
          <Text style={styles.name}>Запись</Text>
          <Text>{new Date(b.startsAtUtc).toLocaleString()}</Text>
          <Text style={{ color: "gray" }}>Статус: {BookingStatusLabel[b.status]}</Text>
          {b.status === 0 || b.status === 1 ? (
            <TouchableOpacity onPress={() => cancelBooking(b.id)} style={[styles.button, { marginTop: 10 }]}>
              <Text style={styles.buttonText}>Отменить</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

const BookingStatusLabel = {
  0: "Ожидает подтверждения",
  1: "Подтверждено",
  2: "Отклонено",
  3: "Отменено родителем",
  4: "Отменено специалистом",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, padding: 14, alignItems: "center" },
  activeTab: { borderBottomColor: PRIMARY, borderBottomWidth: 2 },
  tabText: { color: "#888", fontWeight: "500" },
  activeTabText: { color: PRIMARY, fontWeight: "700" },
  card: { backgroundColor: "#fff", padding: 14, margin: 10, borderRadius: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  name: { fontSize: 16, fontWeight: "600" },
  city: { color: "gray", marginVertical: 2 },
  about: { color: "#555" },
  price: { color: PRIMARY, fontWeight: "600", marginTop: 5 },
  nameLarge: { fontSize: 20, fontWeight: "700", marginTop: 10 },
  button: { backgroundColor: PRIMARY, borderRadius: 10, padding: 12, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "600" },
  slot: { borderWidth: 1, borderColor: "#ddd", padding: 10, borderRadius: 8, marginTop: 6 },
  sectionTitle: { fontWeight: "700", marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#fff", borderRadius: 12, padding: 20, width: "85%" },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, minHeight: 60, textAlignVertical: "top" },
});
