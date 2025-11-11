import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  Switch,
} from "react-native";
import {
  getSpecialists,
  SpecialistCatalogItem,
  getSpecialistProfile,
  getAvailability,
} from "../../api/specialist";
import { getReviews, addReview } from "../../api/reviews"; 
import { createBooking } from "../../api/bookings";
import { listChildren, Child } from "../../api/parent/children";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Что добавлено:
 * - На карточке: ⭐ avg (count)
 * - В модалке: секция «Отзывы» (первые 3 + «Показать ещё»)
 * - Форма «Оставить отзыв»: рейтинг звёздами, текст, анонимность
 * - Обновление списка отзывов и агрегатов после отправки
 */

const PRIMARY = "#61A43B";
const BG = "#F6F8F5";
const TEXT = "#1F2A1F";
const MUTED = "#6E7D74";
const BORDER = "#E1E8E1";

function formatPriceKZT(price?: number | null) {
  if (price === null || price === undefined) return "—";
  try {
    return new Intl.NumberFormat("ru-KZ", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(price);
  } catch {
    return `${price?.toLocaleString?.() ?? price} ₸`;
  }
}

type ReviewsSummary = {
  average: number;
  count: number;
  items: { id: string; rating: number; comment?: string; authorName: string; createdAtUtc: string }[];
};

export default function ParentCatalogScreen() {
  const [q, setQ] = useState("");
  const [list, setList] = useState<(SpecialistCatalogItem & { averageRating?: number; reviewsCount?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<SpecialistCatalogItem | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [sort, setSort] = useState<"priceAsc" | "priceDesc" | "name" | "rating">("rating");
  const [sortVisible, setSortVisible] = useState(false);
  const insets = useSafeAreaInsets();


  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSpecialists();
      setList(res as any);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await fetchList(); } finally { setRefreshing(false); }
  }, [fetchList]);

  const cities = useMemo(() => {
    const set = new Set<string>();
    list.forEach((s) => s.city && set.add(s.city));
    return Array.from(set).sort();
  }, [list]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let base = ql
      ? list.filter((x) =>
          (x.fullName ?? "").toLowerCase().includes(ql) ||
          (x.about ?? "").toLowerCase().includes(ql) ||
          (x.city ?? "").toLowerCase().includes(ql) ||
          (x.specializations?.join(" ") ?? "").toLowerCase().includes(ql)
        )
      : list.slice();
    if (city) base = base.filter((x) => x.city === city);
    switch (sort) {
      case "priceAsc": base.sort((a, b) => (a.pricePerHour ?? 0) - (b.pricePerHour ?? 0)); break;
      case "priceDesc": base.sort((a, b) => (b.pricePerHour ?? 0) - (a.pricePerHour ?? 0)); break;
      case "name": base.sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "")); break;
      case "rating": base.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)); break;
    }
    return base;
  }, [q, city, list, sort]);

  const resetFilters = () => { setQ(""); setCity(null); setSort("rating"); };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: (insets.top || 0) + 3 }]}>
        <Text style={s.headerTitle}>Специалисты</Text>
        <TouchableOpacity onPress={() => setSortVisible(true)} accessibilityRole="button">
          <Text style={s.sortBtn}>Сортировка ▾</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={s.searchBox}>
        <View style={s.searchRow}>
          <Text style={s.searchIcon}>🔎</Text>
          <TextInput value={q} onChangeText={setQ} placeholder="Поиск: имя, город, навыки" style={s.searchInput} placeholderTextColor="#9AA8A1" returnKeyType="search" />
          {!!q && (<TouchableOpacity onPress={() => setQ("")}> <Text style={s.clearBtn}>Очистить</Text></TouchableOpacity>)}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 8 }}>
          <Chip label={city ?? "Все города"} active={!city} onPress={() => setCity(null)} />
          {cities.map((c) => (<Chip key={c} label={c} active={city === c} onPress={() => setCity(c)} />))}
        </ScrollView>
      </View>

      {/* Meta */}
      <View style={s.metaLine}>
        <Text style={s.metaText}>Найдено: {filtered.length}</Text>
        {(city || q) && (<TouchableOpacity onPress={resetFilters}><Text style={s.resetLink}>Сбросить фильтры</Text></TouchableOpacity>)}
      </View>

      {/* List */}
      {loading ? (
        <View style={{ paddingHorizontal: 12 }}>
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
              title={q || city ? "Ничего не найдено" : "Пока нет специалистов"}
              subtitle={q || city ? "Попробуйте изменить запрос или сбросить фильтры" : "Потяните вниз, чтобы обновить список"}
              onReset={q || city ? resetFilters : undefined}
            />
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} activeOpacity={0.92} onPress={() => setSelected(item)}>
              <View style={s.row}>
                <Avatar name={item.fullName} />
                <View style={{ flex: 1 }}>
                  <Text style={s.name} numberOfLines={1}>{item.fullName}</Text>
                  {!!item.city && <Text style={s.city}>{item.city}</Text>}

                  {/* ⭐ рейтинг на карточке */}
                  {(item as any).reviewsCount > 0 && (
                    <Text style={{ color: "#4B5E55", marginTop: 2 }}>
                      ⭐ {Number((item as any).averageRating).toFixed(1)} ({(item as any).reviewsCount})
                    </Text>
                  )}

                  {!!item.about && <Text style={s.about} numberOfLines={2}>{item.about}</Text>}
                </View>
                <View style={s.priceCol}>
                  <Text style={s.price}>{formatPriceKZT(item.pricePerHour)}</Text>
                  <Text style={s.perHour}>/ час</Text>
                </View>
                <Text style={s.chevron}>›</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Sort modal */}
      <Modal visible={sortVisible} transparent animationType="fade">
        <TouchableOpacity style={s.sortBackdrop} activeOpacity={1} onPress={() => setSortVisible(false)}>
          <View style={s.sortCard}>
            <Text style={s.sortTitle}>Сортировка</Text>
            <SortItem label="Рейтинг" active={sort === "rating"} onPress={() => { setSort("rating"); setSortVisible(false); }} />
            <SortItem label="Цена: по возрастанию" active={sort === "priceAsc"} onPress={() => { setSort("priceAsc"); setSortVisible(false); }} />
            <SortItem label="Цена: по убыванию" active={sort === "priceDesc"} onPress={() => { setSort("priceDesc"); setSortVisible(false); }} />
            <SortItem label="По имени" active={sort === "name"} onPress={() => { setSort("name"); setSortVisible(false); }} />
          </View>
        </TouchableOpacity>
      </Modal>

      {selected && (
        <SpecialistModal specialist={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
};

function Avatar({ name }: { name?: string | null }) {
  const letter = (name || "?").trim().slice(0, 1).toUpperCase();
  return (
    <View style={s.avatar}><Text style={s.avatarTxt}>{letter}</Text></View>
  );
}

function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[s.chip, active ? s.chipActive : null]}>
      <Text style={[s.chipTxt, active ? s.chipTxtActive : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SortItem({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.sortItem}>
      <Text style={[s.sortItemTxt, active && { color: PRIMARY, fontWeight: "800" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function EmptyState({ title, subtitle, onReset }: { title: string; subtitle?: string; onReset?: () => void }) {
  return (
    <View style={{ alignItems: "center", padding: 28 }}>
      <Text style={{ fontWeight: "900", color: TEXT, marginBottom: 6, fontSize: 16 }}>{title}</Text>
      {!!subtitle && <Text style={{ color: MUTED, textAlign: "center" }}>{subtitle}</Text>}
      {onReset && (
        <TouchableOpacity onPress={onReset} style={[s.buttonGhost, { marginTop: 12 }]}>
          <Text style={s.buttonGhostText}>Сбросить</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CardSkeleton() {
  return (
    <View style={s.card}> 
      <View style={s.row}>
        <View style={[s.avatar, { backgroundColor: "#E6EEE2" }]} />
        <View style={{ flex: 1, gap: 6 }}>
          <View style={[stylesShimmer.block, { width: "60%" }]} />
          <View style={[stylesShimmer.block, { width: "35%" }]} />
          <View style={[stylesShimmer.block, { width: "85%" }]} />
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <View style={[stylesShimmer.block, { width: 80, height: 14 }]} />
        </View>
      </View>
    </View>
  );
}

function SpecialistModal({ specialist, onClose }: { specialist: SpecialistCatalogItem; onClose: () => void; }) {
  const [profile, setProfile] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busySlots, setBusySlots] = useState(false);

  const [reviews, setReviews] = useState<ReviewsSummary | null>(null);
  const [busyMore, setBusyMore] = useState(false);

  // booking
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // add review modal
  const [reviewVisible, setReviewVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const prof = await getSpecialistProfile(specialist.userId);
        setProfile(prof);
        const rv = await getReviews(specialist.userId, 0, 3);
        setReviews(rv);
      } finally { setLoading(false); }
    })();
  }, [specialist.userId]);

  const loadSlots = useCallback(async (days = 7) => {
    setBusySlots(true);
    try {
      const fromUtc = new Date().toISOString();
      const toUtc = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();
      const data = await getAvailability(specialist.userId, fromUtc, toUtc);
      setSlots(data);
    } finally { setBusySlots(false); }
  }, [specialist.userId]);

  const loadMoreReviews = async () => {
    if (!reviews) return;
    setBusyMore(true);
    try {
      const next = await getReviews(specialist.userId, reviews.items.length, 5);
      setReviews({ ...reviews, items: [...reviews.items, ...next.items] });
    } finally { setBusyMore(false); }
  };

  const onReviewSent = async () => {
    // перегружаем агрегацию и последние отзывы
    const rv = await getReviews(specialist.userId, 0, Math.max(3, reviews?.items.length ?? 3));
    setReviews(rv);
    setReviewVisible(false);
  };

  const openBookingModal = (slotId: string) => { setSelectedSlotId(slotId); setBookingModalVisible(true); };
  const closeBookingModal = () => { setBookingModalVisible(false); setSelectedSlotId(null); };

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top", "left", "right"]}>
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={s.modalHeader}>
          <TouchableOpacity onPress={onClose}><Text style={{ color: PRIMARY, fontWeight: "700" }}>← Назад</Text></TouchableOpacity>
          <Text style={s.modalTitle}>Профиль</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
            {/* шапка */}
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <Avatar name={profile.fullName} />
              <View style={{ flex: 1 }}>
                <Text style={s.nameBig}>{profile.fullName}</Text>
                {!!profile.city && <Text style={s.city}>{profile.city}</Text>}
                {reviews && reviews.count > 0 && (
                  <Text style={{ color: "#4B5E55", marginTop: 4 }}>⭐ {reviews.average.toFixed(1)} ({reviews.count})</Text>
                )}
              </View>
              <View style={s.priceBadgeBig}>
                <Text style={s.price}>{formatPriceKZT(profile.pricePerHour)}</Text>
                <Text style={s.perHour}>/ час</Text>
              </View>
            </View>

            {!!profile.about && <Text style={s.aboutBig}>{profile.about}</Text>}

            {!!profile.specializations?.length && (
              <Section title="Специализации">
                <View style={s.tagsRow}>
                  {profile.specializations.map((t: string) => (
                    <View key={t} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>
                  ))}
                </View>
              </Section>
            )}

            {!!profile.skills?.length && (
              <Section title="Навыки">
                <View style={s.tagsRow}>
                  {profile.skills.map((t: string) => (
                    <View key={t} style={s.tag}><Text style={s.tagTxt}>{t}</Text></View>
                  ))}
                </View>
              </Section>
            )}

            <TouchableOpacity onPress={() => loadSlots(7)} style={[s.button, { marginTop: 16 }]}>
              {busySlots ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Показать свободные слоты (7 дней)</Text>}
            </TouchableOpacity>

            {/* слоты */}
            {slots.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={s.sectionTitle}>Ближайшие слоты</Text>
                {slots.slice(0,6).map((sl: any) => (
                  <View key={sl.id} style={s.slotRow}>
                    <Text style={s.slotText}>
                      {new Date(sl.startsAtUtc).toLocaleString([], { day:"2-digit", month:"2-digit", hour: "2-digit", minute: "2-digit" })}
                    </Text>
                    <TouchableOpacity onPress={() => openBookingModal(sl.id)} style={s.slotBtn}>
                      <Text style={s.slotBtnTxt}>Записаться</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* отзывы */}
            {reviews && (
              <Section title={`Отзывы • ⭐ ${reviews.average.toFixed(1)} (${reviews.count})`}>
                {reviews.items.length === 0 ? (
                  <Text style={{ color: MUTED }}>Пока нет отзывов.</Text>
                ) : (
                  <View>
                    {reviews.items.map((r) => (
                      <View key={r.id} style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#EEF4EA" }}>
                        <Text style={{ color: TEXT, fontWeight: "700" }}>⭐ {r.rating} — {r.authorName}</Text>
                        {!!r.comment && <Text style={{ color: "#46534E", marginTop: 2 }}>{r.comment}</Text>}
                        <Text style={{ color: "#92A29B", fontSize: 12, marginTop: 2 }}>{new Date(r.createdAtUtc).toLocaleDateString()}</Text>
                      </View>
                    ))}
                    {reviews.items.length < reviews.count && (
                      <TouchableOpacity onPress={loadMoreReviews} style={[s.buttonGhost, { marginTop: 10 }]}> 
                        {busyMore ? <ActivityIndicator color={PRIMARY} /> : <Text style={s.buttonGhostText}>Показать ещё</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity onPress={() => setReviewVisible(true)} style={[s.button, { marginTop: 12 }]}>
                  <Text style={s.buttonText}>Оставить отзыв</Text>
                </TouchableOpacity>
              </Section>
            )}
          </ScrollView>
        )}

        {/* Booking modal */}
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

        {/* Add review modal */}
        {reviewVisible && (
          <AddReviewModal
            visible={reviewVisible}
            specialistUserId={specialist.userId}
            onClose={() => setReviewVisible(false)}
            onSent={onReviewSent}
          />
        )}
      </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}


function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={{ marginTop: 6 }}>{children}</View>
    </View>
  );
}

/** Add Review Modal */
function AddReviewModal({ visible, specialistUserId, onClose, onSent }: { visible: boolean; specialistUserId: string; onClose: () => void; onSent: () => void; }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async () => {
    try {
      setBusy(true);
      await addReview(specialistUserId, { rating, comment: comment.trim() || undefined, isAnonymous: anonymous });
      onSent();
    } catch (e: any) {
      if (e?.status === 401) {
        Alert.alert("Требуется вход", "Авторизуйтесь, чтобы оставить отзыв.");
      } else {
        Alert.alert("Ошибка", e?.message ?? "Не удалось отправить отзыв");
      }
    } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.bookingBackdrop}>
        <View style={s.bookingCard}>
          <View style={s.bookingHeader}>
            <Text style={s.bookingTitle}>Оставить отзыв</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ color: PRIMARY, fontWeight: "700" }}>Закрыть</Text></TouchableOpacity>
          </View>

          <View style={{ paddingBottom: 8 }}>
            <Text style={s.sectionTitle}>Оценка</Text>
            <StarRating value={rating} onChange={setRating} />

            <Text style={[s.sectionTitle, { marginTop: 12 }]}>Комментарий</Text>
            <TextInput
              style={s.messageInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Поделитесь опытом..."
              placeholderTextColor="#93A29B"
              multiline
            />

            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
              <Switch value={anonymous} onValueChange={setAnonymous} thumbColor={anonymous ? PRIMARY : undefined} />
              <Text style={{ color: TEXT, marginLeft: 8 }}>Оставить отзыв анонимно</Text>
            </View>

            <TouchableOpacity onPress={send} style={[s.button, { marginTop: 16, opacity: busy ? 0.6 : 1 }]} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Отправить</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
      {[1,2,3,4,5].map((i) => (
        <TouchableOpacity key={i} onPress={() => onChange(i)}>
          <Text style={{ fontSize: 24 }}>{i <= value ? "⭐" : "☆"}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** Booking modal (без изменений в логике) */
function BookingModal({ visible, slotId, onClose, onSuccess }: { visible: boolean; slotId: string; onClose: () => void; onSuccess: () => void; }) {
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
      } finally { setLoading(false); }
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
    } finally { setBusy(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={s.bookingBackdrop}>
        <View style={s.bookingCard}>
          <View style={s.bookingHeader}>
            <Text style={s.bookingTitle}>Оформление записи</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ color: PRIMARY, fontWeight: "700" }}>Закрыть</Text></TouchableOpacity>
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
                    <TouchableOpacity key={c.id} onPress={() => setSelectedChildId(c.id)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8 }}>
                      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: checked ? PRIMARY : "#C8D4CE", alignItems: "center", justifyContent: "center", marginRight: 8 }}>
                        {checked ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY }} /> : null}
                      </View>
                      <Text style={{ color: TEXT }}>{label}</Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={{ color: MUTED, marginTop: 6 }}>У вас нет добавленных детей. Добавьте ребёнка в профиле, чтобы записаться.</Text>
              )}

              <Text style={[s.sectionTitle, { marginTop: 12 }]}>Сообщение специалисту</Text>
              <TextInput style={s.messageInput} value={message} onChangeText={setMessage} placeholder="Пожелания, уточнения, особенности ребёнка…" placeholderTextColor="#93A29B" multiline />

              <TouchableOpacity onPress={submit} style={[s.button, { marginTop: 16, opacity: busy || children.length === 0 ? 0.6 : 1 }]} disabled={busy || children.length === 0}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Подтвердить запись</Text>}
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={[s.buttonGhost, { marginTop: 8 }]}>
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
  header: { paddingHorizontal: 12,paddingBottom: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 22, fontWeight: "900", color: TEXT },
  sortBtn: { color: PRIMARY, fontWeight: "700" },

  searchBox: { paddingHorizontal: 12, paddingTop: 6, paddingBottom: 4 },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12, paddingVertical: 10 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: TEXT },
  clearBtn: { color: MUTED },

  metaLine: { paddingHorizontal: 12, paddingBottom: 6, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  metaText: { color: MUTED },
  resetLink: { color: PRIMARY, fontWeight: "700" },

  chip: { backgroundColor: "#fff", borderColor: BORDER, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  chipActive: { backgroundColor: "#E8F2E5", borderColor: "#CFE7C4" },
  chipTxt: { color: TEXT },
  chipTxtActive: { color: PRIMARY, fontWeight: "800" },

  card: { backgroundColor: "#fff", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "#E6EEE2", shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#CFE7C4", alignItems: "center", justifyContent: "center" },
  avatarTxt: { color: "#fff", fontWeight: "800" },
  name: { fontWeight: "800", fontSize: 16, color: TEXT },
  city: { color: MUTED, marginTop: 2 },
  about: { color: "#46534E", marginTop: 6 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  tag: { backgroundColor: "#F1F6EF", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  tagTxt: { color: "#4B5E55", fontSize: 12 },
  priceCol: { alignItems: "flex-end" },
  priceBadgeBig: { backgroundColor: "#E8F2E5", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" },
  price: { color: PRIMARY, fontWeight: "900" },
  perHour: { color: "#4D7A36", fontSize: 12 },
  chevron: { fontSize: 28, color: "#C4D3CB", marginLeft: 4 },

modalHeader: {
  minHeight: 54,        // останется, но SafeAreaView добавит «реальный» отступ сверху на iOS
  paddingBottom: 8,
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
  button: { backgroundColor: PRIMARY, borderRadius: 12, alignItems: "center", paddingVertical: 12 },
  buttonText: { color: "#fff", fontWeight: "800" },
  slotRow: { marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E6EEE2", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  slotText: { color: TEXT },
  slotBtn: { backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  slotBtnTxt: { color: "#fff", fontWeight: "700" },

  sortBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.25)", justifyContent: "flex-end" },
  sortCard: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16 },
  sortTitle: { fontWeight: "900", fontSize: 16, color: TEXT, marginBottom: 6 },
  sortItem: { paddingVertical: 10 },
  sortItemTxt: { color: TEXT },

  // booking/add-review modal styles
  bookingBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  bookingCard: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, maxHeight: "85%" },
  bookingHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  bookingTitle: { fontWeight: "900", fontSize: 18, color: TEXT },
  messageInput: { marginTop: 8, minHeight: 90, borderRadius: 12, borderWidth: 1, borderColor: BORDER, padding: 10, textAlignVertical: "top", backgroundColor: "#fff", color: TEXT },
  buttonGhost: { borderRadius: 12, alignItems: "center", paddingVertical: 12, borderWidth: 1, borderColor: BORDER, backgroundColor: "#fff" },
  buttonGhostText: { color: TEXT, fontWeight: "700" },
});

const stylesShimmer = StyleSheet.create({ block: { height: 12, backgroundColor: "#EEF4EA", borderRadius: 6 } });
