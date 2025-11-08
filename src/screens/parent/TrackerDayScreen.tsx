// screens/parent/TrackerDayScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Modal, Switch, KeyboardAvoidingView, Platform,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import {
  addIncident, addMed, addSession, getDay, getPresets, upsertDay,
} from "../../api/parent/tracker";

const PRIMARY = "#61A43B", TEXT="#1F2A1F", MUTED="#6E7D74", BORDER="#E1E8E1", BG="#F6F8F5";

export default function TrackerDayScreen() {
  const route = useRoute<any>();
  const childId: string = route.params.childId;
  const dateUtc: string = route.params.dateUtc; // 00:00Z дня

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isNarrow = width < 360;     // узкие телефоны
  const isTablet = width >= 600;    // планшеты

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stickyH, setStickyH] = useState(72); // динамическая высота панели

  // базовые метрики
  const [sleep, setSleep] = useState<string>("");
  const [mood, setMood] = useState<number>(3);
  const [sensory, setSensory] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");

  // списки
  const [incidents, setIncidents] = useState<any[]>([]);
  const [meds, setMeds] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);

  // пресеты
  const [presets, setPresets] = useState<{
    antecedent: string[]; behavior: string[]; consequence: string[]; sessionTypes: string[];
  }>({ antecedent: [], behavior: [], consequence: [], sessionTypes: [] });

  // модалки
  const [mInc, setMInc] = useState(false);
  const [mMed, setMMed] = useState(false);
  const [mSes, setMSes] = useState(false);

  const localDate = useMemo(
    () => new Date(dateUtc).toLocaleDateString([], { day: "2-digit", month: "2-digit", year: "numeric" }),
    [dateUtc]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const day = await getDay(childId, dateUtc);
        if (day.sleepTotalHours != null) setSleep(String(day.sleepTotalHours));
        setMood(day.mood || 3);
        setSensory(!!day.sensoryOverload);
        setNote(day.parentNote || "");
        setIncidents(day.incidents || []);
        setMeds(day.medIntakes || []);
        setSessions(day.sessions || []);
        const p = await getPresets();
        setPresets(p as any);
      } finally {
        setLoading(false);
      }
    })();
  }, [childId, dateUtc]);

  const save = async () => {
    try {
      setSaving(true);
      await upsertDay(childId, {
        dateUtc,
        sleepTotalHours: sleep ? Number(sleep) : null,
        mood,
        sensoryOverload: sensory,
        appetite: 0,
        toiletingStatus: 0,
        triggers: [], environmentChanges: [],
        parentNote: note || null,
      });
    } catch (e: any) {
      Alert.alert("Ошибка", e?.response?.data?.detail || "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  };

  // быстрые добавления
  const addQuickIncident = async (payload: any) => {
    const time = new Date().toISOString();
    const id = await addIncident(childId, dateUtc, { timeUtc: time, ...payload });
    setIncidents([{ id, ...payload, timeUtc: time }, ...incidents]);
  };
  const addQuickMed = async (payload: any) => {
    const time = new Date().toISOString();
    const id = await addMed(childId, dateUtc, { timeUtc: time, taken: true, ...payload });
    setMeds([{ id, ...payload, timeUtc: time, taken: true }, ...meds]);
  };
  const addQuickSession = async (payload: any) => {
    const id = await addSession(childId, dateUtc, payload);
    setSessions([{ id, ...payload }, ...sessions]);
  };

  if (loading) return <View style={st.center}><ActivityIndicator color={PRIMARY} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            padding: 12,
            paddingTop: 8,
            paddingBottom: stickyH + insets.bottom + 16, // не перекрывать липкой панелью
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={st.title}>{localDate}</Text>

          {/* ADAPTIVE METRICS GRID */}
          <View style={[st.metricsWrap, isTablet ? { gap: 12 } : { gap: 8 }]}>
            <View style={[st.metric, isTablet ? st.col3 : isNarrow ? st.col1 : st.col2]}>
              <Text style={st.metricLabel}>Сон, ч</Text>
              <TextInput
                value={sleep}
                onChangeText={setSleep}
                keyboardType="numeric"
                placeholder="8"
                style={st.input}
              />
            </View>

            <View style={[st.metric, isTablet ? st.col3 : isNarrow ? st.col1 : st.col2]}>
              <Text style={st.metricLabel}>Настроение</Text>
              <View style={st.pillsRow}>
                {[1, 2, 3, 4, 5].map((v) => (
                  <TouchableOpacity
                    key={v}
                    onPress={() => setMood(v)}
                    style={[st.pill, mood === v && st.pillActive]}
                  >
                    <Text style={[st.pillTxt, mood === v && st.pillTxtActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[st.metric, isTablet ? st.col3 : isNarrow ? st.col1 : st.col2]}>
              <Text style={st.metricLabel}>Сенс.перегр.</Text>
              <View style={{ marginTop: 6, flexDirection: "row", alignItems: "center" }}>
                <Switch value={sensory} onValueChange={setSensory} />
              </View>
            </View>
          </View>

          {/* QUICK EVENTS */}
          <View style={st.card}>
            <Text style={st.section}>Быстрые события</Text>
            <View style={st.quickWrap}>
              <QuickBtn
                label="Крик"
                onPress={() =>
                  addQuickIncident({
                    intensity: 2, durationSec: 60, injury: false,
                    antecedent: ["шум"], behavior: ["крик"], consequence: ["переключение"],
                  })
                }
              />
              <QuickBtn
                label="Удар"
                onPress={() =>
                  addQuickIncident({
                    intensity: 3, durationSec: 30, injury: false,
                    antecedent: ["отказ"], behavior: ["удар"], consequence: ["тайм-аут"],
                  })
                }
              />
              <QuickBtn label="Медикамент" onPress={() => addQuickMed({ drug: "Мелатонин", dose: "1 mg" })} />
              <QuickBtn
                label="Логопед 45м"
                onPress={() => addQuickSession({ type: "логопед", durationMin: 45, quality: 4, goalTags: ["звук Р"] })}
              />
            </View>
          </View>

          {/* LISTS */}
          <Section title={`Инциденты (${incidents.length})`}>
            {incidents.length === 0 ? (
              <Text style={{ color: MUTED }}>Пока пусто</Text>
            ) : (
              incidents.map((x) => (
                <ListRow
                  key={x.id}
                  left={`⭐ ${x.intensity}`}
                  right={new Date(x.timeUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  sub={x.behavior?.join(" • ")}
                />
              ))
            )}
            <TouchableOpacity style={st.buttonGhost} onPress={() => setMInc(true)}>
              <Text style={st.buttonGhostTxt}>Добавить</Text>
            </TouchableOpacity>
          </Section>

          <Section title={`Медикаменты (${meds.length})`}>
            {meds.length === 0 ? (
              <Text style={{ color: MUTED }}>Нет приёмов</Text>
            ) : (
              meds.map((x) => (
                <ListRow
                  key={x.id}
                  left={x.drug + (x.dose ? ` • ${x.dose}` : "")}
                  right={new Date(x.timeUtc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                />
              ))
            )}
            <TouchableOpacity style={st.buttonGhost} onPress={() => setMMed(true)}>
              <Text style={st.buttonGhostTxt}>Добавить</Text>
            </TouchableOpacity>
          </Section>

          <Section title={`Сессии (${sessions.length})`}>
            {sessions.length === 0 ? (
              <Text style={{ color: MUTED }}>Нет занятий</Text>
            ) : (
              sessions.map((x) => (
                <ListRow key={x.id} left={`${x.type}`} right={`${x.durationMin} мин`} sub={x.goalTags?.join(" • ")} />
              ))
            )}
            <TouchableOpacity style={st.buttonGhost} onPress={() => setMSes(true)}>
              <Text style={st.buttonGhostTxt}>Добавить</Text>
            </TouchableOpacity>
          </Section>

          <Section title="Заметка">
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Короткая заметка..."
              multiline
              style={[st.input, { minHeight: 90, textAlignVertical: "top" }]}
            />
          </Section>
        </ScrollView>

        {/* STICKY ACTION BAR */}
        <View
          style={[st.sticky, { paddingBottom: Math.max(insets.bottom, 8) }]}
          onLayout={(e) => setStickyH(e.nativeEvent.layout.height)}
        >
          <TouchableOpacity style={[st.btn, { flex: 1, opacity: saving ? 0.7 : 1 }]} disabled={saving} onPress={save}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={st.btnTxt}>Сохранить</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={[st.btnGhost, { flex: 1 }]} onPress={() => setMInc(true)}>
            <Text style={st.btnGhostTxt}>+ Событие</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      {mInc && (
        <IncidentModal
          presets={presets}
          onClose={() => setMInc(false)}
          onSubmit={async (p) => {
            await addQuickIncident(p);
            setMInc(false);
          }}
        />
      )}
      {mMed && (
        <MedModal
          onClose={() => setMMed(false)}
          onSubmit={async (p) => {
            await addQuickMed(p);
            setMMed(false);
          }}
        />
      )}
      {mSes && (
        <SessionModal
          presets={presets}
          onClose={() => setMSes(false)}
          onSubmit={async (p) => {
            await addQuickSession(p);
            setMSes(false);
          }}
        />
      )}
    </View>
  );
}

/* ====== UI helpers ====== */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={st.card}>
      <Text style={st.section}>{title}</Text>
      <View style={{ marginTop: 8 }}>{children}</View>
    </View>
  );
}
function ListRow({ left, right, sub }: { left: string; right?: string; sub?: string }) {
  return (
    <View style={st.row}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ color: TEXT, fontWeight: "700" }}>{left}</Text>
        {!!right && <Text style={{ color: MUTED, marginLeft: 8 }}>{right}</Text>}
      </View>
      {!!sub && <Text style={{ color: "#4B5E55", marginTop: 4 }}>{sub}</Text>}
    </View>
  );
}
function QuickBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={st.quick}>
      <Text style={st.quickTxt} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ====== Modals ====== */
function WrapModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <Modal transparent animationType="slide">
      <View style={st.backdrop}>
        <View style={st.sheet}>
          <View style={st.sheetHead}>
            <Text style={{ fontWeight: "900", color: TEXT }}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ color: PRIMARY, fontWeight: "800" }}>Закрыть</Text>
            </TouchableOpacity>
          </View>
          <ScrollView>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}
function IncidentModal({
  presets,
  onClose,
  onSubmit,
}: {
  presets: { antecedent: string[]; behavior: string[]; consequence: string[] };
  onClose: () => void;
  onSubmit: (p: any) => void;
}) {
  const [intensity, setIntensity] = useState(2);
  const [notes, setNotes] = useState("");
  const [selA, setSelA] = useState<string[]>([]);
  const [selB, setSelB] = useState<string[]>([]);
  const [selC, setSelC] = useState<string[]>([]);
  return (
    <WrapModal title="Инцидент" onClose={onClose}>
      <Text style={st.modalLabel}>Интенсивность</Text>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <TouchableOpacity key={v} onPress={() => setIntensity(v)} style={[st.pill, intensity === v && st.pillActive]}>
            <Text style={[st.pillTxt, intensity === v && st.pillTxtActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[st.modalLabel, { marginTop: 10 }]}>Antecedent</Text>
      <TagGroup items={presets.antecedent} selected={selA} onToggle={(t) => toggle(selA, t, setSelA)} />

      <Text style={[st.modalLabel, { marginTop: 10 }]}>Behavior</Text>
      <TagGroup items={presets.behavior} selected={selB} onToggle={(t) => toggle(selB, t, setSelB)} />

      <Text style={[st.modalLabel, { marginTop: 10 }]}>Consequence</Text>
      <TagGroup items={presets.consequence} selected={selC} onToggle={(t) => toggle(selC, t, setSelC)} />

      <Text style={[st.modalLabel, { marginTop: 10 }]}>Заметка</Text>
      <TextInput value={notes} onChangeText={setNotes} style={[st.input, { minHeight: 80 }]} multiline placeholder="Коротко..." />

      <TouchableOpacity
        style={[st.btn, { marginTop: 12 }]}
        onPress={() => onSubmit({ intensity, durationSec: 60, injury: false, antecedent: selA, behavior: selB, consequence: selC, notes })}
      >
        <Text style={st.btnTxt}>Добавить</Text>
      </TouchableOpacity>
    </WrapModal>
  );
}
function MedModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: any) => void }) {
  const [drug, setDrug] = useState("");
  const [dose, setDose] = useState("");
  const [taken, setTaken] = useState(true);
  return (
    <WrapModal title="Медикамент" onClose={onClose}>
      <Text style={st.modalLabel}>Название</Text>
      <TextInput value={drug} onChangeText={setDrug} style={st.input} placeholder="Напр., Мелатонин" />
      <Text style={[st.modalLabel, { marginTop: 10 }]}>Доза</Text>
      <TextInput value={dose} onChangeText={setDose} style={st.input} placeholder="1 mg" />
      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10 }}>
        <Switch value={taken} onValueChange={setTaken} />
        <Text style={{ marginLeft: 8, color: TEXT }}>Принято</Text>
      </View>
      <TouchableOpacity style={[st.btn, { marginTop: 12 }]} onPress={() => onSubmit({ drug, dose, taken })}>
        <Text style={st.btnTxt}>Добавить</Text>
      </TouchableOpacity>
    </WrapModal>
  );
}
function SessionModal({
  presets,
  onClose,
  onSubmit,
}: {
  presets: { sessionTypes: string[] };
  onClose: () => void;
  onSubmit: (p: any) => void;
}) {
  const [type, setType] = useState(presets.sessionTypes[0] || "занятие");
  const [duration, setDuration] = useState("45");
  const [quality, setQuality] = useState(4);
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  return (
    <WrapModal title="Сессия" onClose={onClose}>
      <Text style={st.modalLabel}>Тип</Text>
      <TagGroup
        items={presets.sessionTypes.length ? presets.sessionTypes : ["логопед", "АВА", "ЛФК", "эрго"]}
        single
        selected={tags.length ? [tags[0]] : []}
        onToggle={(t) => setTags([t])}
      />
      <Text style={[st.modalLabel, { marginTop: 10 }]}>Длительность, мин</Text>
      <TextInput value={duration} onChangeText={setDuration} keyboardType="numeric" style={st.input} placeholder="45" />
      <Text style={[st.modalLabel, { marginTop: 10 }]}>Качество</Text>
      <View style={{ flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
        {[1, 2, 3, 4, 5].map((v) => (
          <TouchableOpacity key={v} onPress={() => setQuality(v)} style={[st.pill, quality === v && st.pillActive]}>
            <Text style={[st.pillTxt, quality === v && st.pillTxtActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[st.modalLabel, { marginTop: 10 }]}>Цели (теги)</Text>
      <TagGroup items={["слоги", "звук Р", "самообслуж.", "сенсор"]} selected={tags} onToggle={(t) => toggle(tags, t, setTags)} />
      <Text style={[st.modalLabel, { marginTop: 10 }]}>Заметка</Text>
      <TextInput value={notes} onChangeText={setNotes} style={[st.input, { minHeight: 80 }]} multiline placeholder="Что делали..." />
      <TouchableOpacity
        style={[st.btn, { marginTop: 12 }]}
        onPress={() => onSubmit({ type: tags[0] || type, durationMin: Number(duration) || 45, quality, goalTags: tags, notes })}
      >
        <Text style={st.btnTxt}>Добавить</Text>
      </TouchableOpacity>
    </WrapModal>
  );
}

/* ====== TAGS ====== */
function Tag({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={[st.tag, active && st.tagActive]}>
      <Text style={[st.tagTxt, active && st.tagTxtActive]}>{label}</Text>
    </TouchableOpacity>
  );
}
function TagGroup({
  items, selected, onToggle, single,
}: {
  items: string[]; selected: string[]; onToggle: (t: string) => void; single?: boolean;
}) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
      {items.map((t) => (
        <Tag
          key={t}
          label={t}
          active={selected.includes(t)}
          onPress={() => {
            if (single) {
              onToggle(t);
            } else {
              onToggle(t);
            }
          }}
        />
      ))}
    </View>
  );
}
function toggle(sel: string[], t: string, set: (v: string[]) => void) {
  set(sel.includes(t) ? sel.filter((x) => x !== t) : [...sel, t]);
}

/* ====== STYLES ====== */
const st = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: BG },
  title: { fontWeight: "900", fontSize: 20, color: TEXT, marginBottom: 8, marginLeft: 4, marginTop: 8 },

  // GRID
  metricsWrap: { flexDirection: "row", flexWrap: "wrap" },
  col1: { width: "100%" },
  col2: { width: "48%" },   // 2 колонки на узких
  col3: { width: "32%" },   // 3 колонки на планшете
  metric: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E6EEE2", borderRadius: 14, padding: 12, marginBottom: 8 },
  metricLabel: { color: TEXT, fontWeight: "800" },

  input: { borderWidth: 1, borderColor: BORDER, borderRadius: 10, padding: 10, backgroundColor: "#fff", color: TEXT, marginTop: 6, minHeight: 40 },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  pill: { borderWidth: 1, borderColor: BORDER, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, minWidth: 36, alignItems: "center" },
  pillActive: { backgroundColor: "#E8F2E5", borderColor: "#CFE7C4" },
  pillTxt: { color: TEXT }, pillTxtActive: { color: PRIMARY, fontWeight: "800" },

  // CARDS
  card: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E6EEE2", borderRadius: 14, padding: 12, marginTop: 10 },
  section: { color: TEXT, fontWeight: "800" },

  // QUICK WRAP
  quickWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  quick: {
    backgroundColor: "#F1F6EF", borderColor: "#DFE8E1", borderWidth: 1,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10,
    flexGrow: 1, flexBasis: "48%", alignItems: "center",
  },
  quickTxt: { color: "#4B5E55", fontWeight: "700" },

  // LIST ROWS
  row: { paddingVertical: 10, borderBottomColor: "#EEF4EA", borderBottomWidth: 1 },
  buttonGhost: { marginTop: 10, borderWidth: 1, borderColor: BORDER, alignItems: "center", padding: 12, borderRadius: 10, backgroundColor: "#fff" },
  buttonGhostTxt: { color: TEXT, fontWeight: "700" },

  // STICKY
  sticky: {
    position: "absolute", left: 12, right: 12, bottom: 0,
    backgroundColor: "rgba(246,248,245,0.96)",
    flexDirection: "row", gap: 10, paddingTop: 10, paddingHorizontal: 4,
  },
  btn: { backgroundColor: PRIMARY, alignItems: "center", padding: 14, borderRadius: 12 },
  btnTxt: { color: "#fff", fontWeight: "800" },
  btnGhost: { borderWidth: 1, borderColor: BORDER, alignItems: "center", padding: 14, borderRadius: 12, backgroundColor: "#fff" },
  btnGhostTxt: { color: TEXT, fontWeight: "800" },

  // Modals
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: "75%", padding: 16 },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  modalLabel: { color: TEXT, fontWeight: "700", marginTop: 4 },

  tag: { backgroundColor: "#fff", borderWidth: 1, borderColor: BORDER, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  tagActive: { backgroundColor: "#E8F2E5", borderColor: "#CFE7C4" },
  tagTxt: { color: TEXT }, tagTxtActive: { color: PRIMARY, fontWeight: "800" },
});
