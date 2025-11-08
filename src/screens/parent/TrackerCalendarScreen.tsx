import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, FlatList
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getDays } from "../../api/parent/tracker";
import { listChildren, Child } from "../../api/parent/children";

const PRIMARY = "#61A43B", TEXT="#1F2A1F", MUTED="#6E7D74", BORDER="#E1E8E1", BG="#F6F8F5";

function toDayStartUtcISOString(input: string | Date) {
  const d = (input instanceof Date) ? input : new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}
function formatShort(d: Date) {
  const wd = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"][d.getDay()];
  const dd = String(d.getDate()).padStart(2,"0");
  return `${wd}\n${dd}`;
}
function addDays(d: Date, n: number) { const t = new Date(d); t.setDate(t.getDate()+n); return t; }

export default function TrackerCalendarScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();

  // child selection
  const routeChildId: string | undefined = route.params?.childId;
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState<string | null>(routeChildId ?? null);
  const [noKids, setNoKids] = useState(false);

  // days data
  const [markers, setMarkers] = useState<{date: string; hasEntry: boolean; incidentsCount: number}[]>([]);
  const [loading, setLoading] = useState(true);

  // week strip anchor — сегодня
  const today = useMemo(() => new Date(), []);
  const week = useMemo(() => {
    // неделя вс-сб как во многих трекерах
    const start = addDays(today, -today.getDay());
    return [...Array(7)].map((_,i)=>addDays(start, i));
  }, [today]);

  useEffect(() => {
    (async () => {
      if (!routeChildId) {
        const kids = await listChildren().catch(()=>[]);
        setChildren(kids);
        if (kids.length === 0) { setNoKids(true); setLoading(false); return; }
        setChildId(kids[0].id);
      } else {
        const kids = await listChildren().catch(()=>[]);
        setChildren(kids);
      }
    })();
  }, [routeChildId]);

  useEffect(() => {
    if (!childId) return;
    (async () => {
      setLoading(true);
      try {
        const to = new Date();
        const from = addDays(to, -27);
        const res = await getDays(childId, from.toISOString(), to.toISOString());
        setMarkers(res);
      } finally { setLoading(false); }
    })();
  }, [childId]);

  const markMap = useMemo(() => {
    const m = new Map<string, {hasEntry:boolean; incidentsCount:number}>();
    markers.forEach(x => m.set(x.date, {hasEntry:x.hasEntry, incidentsCount:x.incidentsCount}));
    return m;
  }, [markers]);

  const openDay = (d: Date) => {
    if (!childId) return;
    navigation.navigate("TrackerDay", { childId, dateUtc: toDayStartUtcISOString(d) });
  };

  if (noKids) {
    return (
      <View style={st.center}>
        <Text style={{fontWeight:"900",fontSize:18,color:TEXT,marginBottom:8}}>У вас пока нет детей</Text>
        <Text style={{color:MUTED,textAlign:"center"}}>Добавьте ребёнка во вкладке «Семья», чтобы пользоваться трекером.</Text>
      </View>
    );
  }

  if (loading && !childId) {
    return <View style={st.center}><ActivityIndicator color={PRIMARY}/></View>;
  }

  return (
    <View style={{flex:1, backgroundColor:BG}}>
      {/* Header: child picker */}
      <View style={st.header}>
        <Text style={st.title}>Трекер</Text>
        {!!children.length && (
          <TouchableOpacity style={st.childBtn} onPress={()=>{
            // циклим по детям по нажатию (простая версия)
            if (!childId) return;
            const idx = children.findIndex(c=>c.id===childId);
            const next = children[(idx+1)%children.length];
            setChildId(next.id);
          }}>
            <Text style={st.childTxt}>
              {children.find(c=>c.id===childId)?.firstName || "Ребёнок"} ▾
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Week strip */}
      <View style={st.weekStrip}>
        {week.map((d) => {
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
          const mark = markMap.get(key);
          const isToday = d.toDateString() === today.toDateString();
          return (
            <TouchableOpacity key={key} onPress={()=>openDay(d)} style={[st.day, isToday && st.dayToday]}>
              <Text style={[st.dayTxt, isToday && st.dayTxtToday]}>{formatShort(d)}</Text>
              {!!mark && mark.hasEntry && (
                <Text style={st.dot}>{mark.incidentsCount>0 ? `• ${mark.incidentsCount}` : "•"}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List of last 28 days with quick jump */}
      {loading ? (
        <View style={st.center}><ActivityIndicator color={PRIMARY}/></View>
      ) : (
        <FlatList
          data={markers.slice().sort((a,b)=>a.date.localeCompare(b.date)).reverse()}
          keyExtractor={(i)=>i.date}
          contentContainerStyle={{padding:12}}
          renderItem={({item})=>{
            const d = new Date(item.date+"T00:00:00Z");
            return (
              <TouchableOpacity style={st.row} onPress={()=>openDay(d)}>
                <Text style={st.rowDate}>
                  {d.toLocaleDateString([], {day:"2-digit",month:"2-digit",year:"2-digit"})}
                </Text>
                <View style={{flex:1}}/>
                {item.hasEntry
                  ? <Text style={st.badge}>Запись • инциденты: {item.incidentsCount}</Text>
                  : <Text style={{color:MUTED}}>пусто</Text>}
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={() => (
            <TouchableOpacity style={st.cta} onPress={()=>openDay(new Date())}>
              <Text style={{color:"#fff",fontWeight:"800"}}>Перейти на сегодня</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  center:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:BG,padding:16},
  header:{paddingHorizontal:12,paddingTop:10,paddingBottom:6, flexDirection:"row", alignItems:"center",justifyContent:"space-between"},
  title:{fontSize:22,fontWeight:"900",color:TEXT},
  childBtn:{paddingHorizontal:12,paddingVertical:8, borderRadius:12, backgroundColor:"#E8F2E5", borderWidth:1, borderColor:"#CFE7C4"},
  childTxt:{color:"#2E5B2E", fontWeight:"800"},
  weekStrip:{flexDirection:"row", justifyContent:"space-between", paddingHorizontal:12, paddingBottom:6},
  day:{width:48, alignItems:"center", paddingVertical:8, borderRadius:12, borderWidth:1, borderColor:BORDER, backgroundColor:"#fff"},
  dayToday:{backgroundColor:"#F1F6EF", borderColor:"#CFE7C4"},
  dayTxt:{textAlign:"center", color:TEXT, fontWeight:"700", lineHeight:18},
  dayTxtToday:{color:PRIMARY},
  dot:{color:PRIMARY, fontWeight:"900", marginTop:2},
  row:{backgroundColor:"#fff", borderWidth:1, borderColor:"#E6EEE2", padding:12, borderRadius:12, flexDirection:"row", alignItems:"center", marginBottom:8},
  rowDate:{color:TEXT, fontWeight:"700"},
  badge:{color:PRIMARY, fontWeight:"800"},
  cta:{marginTop:6, backgroundColor:PRIMARY, padding:12, alignItems:"center", borderRadius:12, marginHorizontal:12, marginBottom:24},
});
