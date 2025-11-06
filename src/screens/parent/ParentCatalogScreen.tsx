import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import {
  getSpecialists,
  SpecialistCatalogItem,
  getSpecialistProfile,
  getAvailability,
} from "../../api/specialist";
import { createBooking } from "../../api/bookings";
import { listChildren, Child } from "../../api/parent/children";

/**
 * UX goals in this redesign
 * - Clearer visual hierarchy & spacing
 * - Debounced search, persistent filters, empty states
 * - Polished specialist cards with skeletons & price formatting
 * - Profile modal with grouped slots by day and sticky actions
 * - Accessible touch targets & consistent typography
 */

const PRIMARY = "#61A43B";
const BG = "#F7FAF6";
const TEXT = "#2B2F2C";
const MUTED = "#7A8A83";
const BORDER = "#E1E7DF";

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

function formatPriceKZT(price?: number | null) {
  if (!price && price !== 0) return "—";
  try {
    return new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${price.toLocaleString()} ₸`;
  }
}

export default function ParentCatalogScreen() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<SpecialistCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<SpecialistCatalogItem | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const debouncedQ = useDebounced(q, 300);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSpecialists();
      setList(res);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchList();
    } finally {
      setRefreshing(false);
    }
  }, [fetchList]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    list.forEach((s) => s.city && set.add(s.city));
    return Array.from(set).sort();
  }, [list]);

  const filtered = useMemo(() => {
    const ql = debouncedQ.trim().toLowerCase();
    const base = ql
      ? list.filter((x) =>
          (x.fullName ?? "").toLowerCase().includes(ql) ||
          (x.about ?? "").toLowerCase().includes(ql) ||
          (x.city ?? "").toLowerCase().includes(ql) ||
          (x.specializations?.join(" ") ?? "").toLowerCase().includes(ql)
        )
      : list;
    return city ? base.filter((x) => x.city === city) : base;
  }, [debouncedQ, city, list]);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Специалисты</Text>
      </View>

      {/* Search + Filters */}
      <View style={s.searchWrap}>
        <View style={s.searchInputWrap}>
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Поиск: имя, город, навыки"
            style={s.searchInput}
            placeholderTextColor="#93A29B"
            accessibilityLabel="Поиск специалистов"
            returnKeyType="search"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <FilterChip label={city ?? "Все города"} onPress={() => setCity(null)} active={city === null} />
          {cities.map((c) => (
            <FilterChip key={c} label={c} onPress={() => setCity(c)} active={city === c} />
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ paddingTop: 24 }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.userId}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={() => (
            <EmptyState
              title={debouncedQ || city ? "Ничего не найдено" : "Пока нет специалистов"}
              subtitle={debouncedQ || city ? "Измените запрос или сбросьте фильтры." : "Потяните вниз, чтобы обновить список."}
            />
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={s.card}
              activeOpacity={0.9}
              onPress={() => setSelected(item)}
              accessibilityRole="button"
              accessibilityLabel={`Открыть профиль: ${item.fullName}`}
            >
              <View style={s.row}>
                <AvatarStub name={item.fullName} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name}>{item.fullName}</Text>
                  {!!item.city && <Text style={s.city}>{item.city}</Text>}
                  {!!item.specializations?.length && (
                    <Text style={s.tags} numberOfLines={1}>
                      {item.specializations.join(" • ")}
                    </Text>
                  )}
                  {!!item.about && (
                    <Text style={s.about} numberOfLines={2}>
                      {item.about}
                    </Text>
                  )}
                </View>
                <View style={s.priceBadge}>
                  <Text style={s.priceText}>{formatPriceKZT(item.pricePerHour)}</Text>
                  <Text style={s.perHour}>/ час</Text>
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

function AvatarStub({ name }: { name?: string | null }) {
  const letter = (name || "?").trim().slice(0, 1).toUpperCase();
  return (
    <View style={s.avatarStub}>
      <Text style={{ color: "#fff", fontWeight: "800" }}>{letter}</Text>
    </View>
  );
}

function FilterChip({ label, onPress, active }: { label: string; onPress: () => void; active?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active && s.chipActive]}>
      <Text style={[s.chipText, active && s.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ alignItems: "center", padding: 32 }}>
      <Text style={{ fontWeight: "900", color: TEXT, marginBottom: 6 }}>{title}</Text>
      {!!subtitle && <Text style={{ color: MUTED, textAlign: "center" }}>{subtitle}</Text>}
    </View>
  );
}

function CardSkeleton() {
  return (
    <View style={[s.card, { overflow: "hidden" }]}> 
      <View style={s.row}>
        <View style={[s.avatarStub, { backgroundColor: "#E6EEE2" }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[stylesShimmer.block, { width: "55%" }]} />
          <View style={[stylesShimmer.block, { width: "35%" }]} />
          <View style={[stylesShimmer.block, { width: "85%" }]} />
        </View>
        <View style={[s.priceBadge, { backgroundColor: "#F2F7EF" }]}>
          <View style={[stylesShimmer.block, { width: 60, height: 12 }]} />
        </View>
      </View>
    </View>
  );
}

function SpecialistModal({
  specialist,
  onClose,
}: {
  specialist: SpecialistCatalogItem;
  onClose: () => void;
}) {
  const [profile, setProfile] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySlots, setBusySlots] = useState(false);

  // booking modal
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const prof = await getSpecialistProfile(specialist.userId);
        setProfile(prof);
      } finally {
        setLoading(false);
      }
    })();
  }, [specialist.userId]);

  const loadSlots = useCallback(async (days = 7) => {
    setBusySlots(true);
    try {
      const fromUtc = new Date().toISOString();
      const toUtc = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
      const data = await getAvailability(specialist.userId, fromUtc, toUtc);
      setSlots(data);
    } finally {
      setBusySlots(false);
    }
  }, [specialist.userId]);

  const groupedByDay = useMemo(() => {
    const fmt = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit" });
    const groups: Record<string, any[]> = {};
    slots.forEach((sl) => {
      const key = fmt.format(new Date(sl.startsAtUtc));
      (groups[key] ||= []).push(sl);
    });
    return Object.entries(groups);
  }, [slots]);

  const openBookingModal = (slotId: string) => {
    setSelectedSlotId(slotId);
    setBookingModalVisible(true);
  };

  const closeBookingModal = () => {
    setBookingModalVisible(false);
    setSelectedSlotId(null);
  };

  return (
    <Modal visible animationType="slide">
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Text style={{ color: PRIMARY, fontWeight: "700" }}>← Назад</Text>
          </TouchableOpacity>
          <Text style={s.modalTitle}>Профиль специалиста</Text>
          <View style={{ width: 48 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }}>
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <AvatarStub name={profile.fullName} />
              <View style={{ flex: 1 }}>
                <Text style={s.nameBig}>{profile.fullName}</Text>
                {!!profile.city && <Text style={s.city}>{profile.city}</Text>}
              </View>
              <View style={s.priceBadgeBig}>
                <Text style={s.priceText}>{formatPriceKZT(profile.pricePerHour)}</Text>
                <Text style={s.perHour}>/ час</Text>
              </View>
            </View>

            {!!profile.about && <Text style={s.aboutBig}>{profile.about}</Text>}

            {!!profile.specializations?.length && (
              <Section title="Специализации">
                <Text style={s.tags}>{profile.specializations.join(" • ")}</Text>
              </Section>
            )}

            {!!profile.skills?.length && (
              <Section title="Навыки">
                <Text style={s.tags}>{profile.skills.join(" • ")}</Text>
              </Section>
            )}

            <TouchableOpacity onPress={() => loadSlots(7)} style={[s.button, { marginTop: 16 }]}>
              {busySlots ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.buttonText}>Показать свободные слоты (7 дней)</Text>
              )}
            </TouchableOpacity>

            {groupedByDay.length > 0 && (
              <View style={{ marginTop: 12 }}>
                {groupedByDay.map(([day, items]) => (
                  <View key={day} style={{ marginTop: 8 }}>
                    <Text style={[s.sectionTitle, { marginBottom: 6 }]}>{day}</Text>
                    {items.map((sl) => (
                      <View key={sl.id} style={s.slotRow}>
                        <Text style={s.slotText}>
                          {new Date(sl.startsAtUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {"  —  "}
                          {new Date(sl.endsAtUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                        <TouchableOpacity onPress={() => openBookingModal(sl.id)} style={s.slotBtn}>
                          <Text style={s.slotBtnTxt}>Записаться</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ))}

                <TouchableOpacity onPress={() => loadSlots(14)} style={[s.buttonGhost, { marginTop: 10 }]}
                >
                  <Text style={s.buttonGhostText}>Показать на 14 дней вперёд</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}

        {bookingModalVisible && selectedSlotId && (
          <BookingModal
            visible={bookingModalVisible}
            slotId={selectedSlotId}
            onClose={closeBookingModal}
            onSuccess={() => {
              Alert.alert("Успешно", "Заявка отправлена! Ожидайте подтверждения.");
              closeBookingModal();
              onClose();
            }}
          />
        )}
      </View>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={{ marginTop: 4 }}>{children}</View>
    </View>
  );
}

/** Booking modal */
function BookingModal({
  visible,
  slotId,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  slotId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      try {
        const kids = await listChildren();
        setChildren(kids);
        if (kids.length === 1) setSelectedChildId(kids[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, [visible]);

  const submit = async () => {
    try {
      if (!selectedChildId) {
        Alert.alert("Выберите ребёнка", "Пожалуйста, выберите ребёнка перед записью.");
        return;
      }
      setBusy(true);
      await createBooking(slotId, selectedChildId, message.trim() || undefined);
      onSuccess();
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось создать бронь");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.bookingBackdrop}>
        <View style={s.bookingCard}>
          <View style={s.bookingHeader}>
            <Text style={s.bookingTitle}>Оформление записи</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: PRIMARY, fontWeight: "700" }}>Закрыть</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={PRIMARY} style={{ marginVertical: 16 }} />
          ) : (
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
              <Text style={s.sectionTitle}>Ребёнок</Text>
              {children.length > 0 ? (
                children.map((c) => {
                  const label = c.lastName ? `${c.firstName} ${c.lastName}` : c.firstName;
                  const checked = selectedChildId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedChildId(c.id)}
                      style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: checked ? PRIMARY : "#C8D4CE",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 8,
                        }}
                      >
                        {checked ? (
                          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY }} />
                        ) : null}
                      </View>
                      <Text style={{ color: TEXT }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ color: MUTED, marginTop: 6 }}>
                  У вас нет добавленных детей. Добавьте ребёнка в профиле, чтобы записаться.
                </Text>
              )}

              <Text style={[s.sectionTitle, { marginTop: 12 }]}>Сообщение специалисту</Text>
              <TextInput
                style={s.messageInput}
                value={message}
                onChangeText={setMessage}
                placeholder="Пожелания, уточнения, особенности ребёнка…"
                placeholderTextColor="#93A29B"
                multiline
              />

              <TouchableOpacity
                onPress={submit}
                style={[s.button, { marginTop: 16, opacity: busy || children.length === 0 ? 0.6 : 1 }]}
                disabled={busy || children.length === 0}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Подтвердить запись</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={[s.buttonGhost, { marginTop: 8 }]}
              >
                <Text style={s.buttonGhostText}>Отмена</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: { paddingTop: 10, paddingHorizontal: 12, paddingBottom: 6 },
  headerTitle: { fontSize: 22, fontWeight: "900", color: TEXT },

  searchWrap: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4, gap: 8 },
  searchInputWrap: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: { color: TEXT },

  chip: {
    backgroundColor: "#fff",
    borderColor: BORDER,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: { backgroundColor: "#E8F2E5", borderColor: "#CFE7C4" },
  chipText: { color: TEXT },
  chipTextActive: { color: PRIMARY, fontWeight: "800" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E6EEE2",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatarStub: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#CFE7C4",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontWeight: "800", fontSize: 16, color: TEXT },
  city: { color: MUTED, marginTop: 2 },
  about: { color: "#46534E", marginTop: 6 },
  tags: { color: "#50645B" },
  priceBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F2E5",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
  },
  priceBadgeBig: {
    backgroundColor: "#E8F2E5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
  },
  priceText: { color: PRIMARY, fontWeight: "900" },
  perHour: { color: "#4D7A36", fontSize: 12 },

  modalHeader: {
    height: 54,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEFE8",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontWeight: "800", color: TEXT },
  nameBig: { fontWeight: "900", fontSize: 20, color: TEXT },
  aboutBig: { color: "#46534E", marginTop: 10 },
  sectionTitle: { marginTop: 10, fontWeight: "800", color: TEXT },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  buttonText: { color: "#fff", fontWeight: "800" },
  slotRow: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E6EEE2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  slotText: { color: TEXT },
  slotBtn: { backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  slotBtnTxt: { color: "#fff", fontWeight: "700" },

  // booking modal styles
  bookingBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  bookingCard: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "85%" },
  bookingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  bookingTitle: { fontWeight: "900", fontSize: 18, color: TEXT },
  messageInput: {
    marginTop: 8,
    minHeight: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    textAlignVertical: "top",
    backgroundColor: "#fff",
    color: TEXT,
  },
  buttonGhost: {
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#fff",
  },
  buttonGhostText: { color: TEXT, fontWeight: "700" },
});

const stylesShimmer = StyleSheet.create({
  block: { height: 12, backgroundColor: "#EEF4EA", borderRadius: 6 },
});
