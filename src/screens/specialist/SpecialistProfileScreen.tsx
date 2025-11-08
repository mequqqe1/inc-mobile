import React, { useEffect, useMemo, useState } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import Section from "../../components/Section";
import { Card, PrimaryButton, Chip } from "../../components/Ui";
import { View, Text, Image, Alert, ActivityIndicator, FlatList, Pressable } from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import { Field } from "../../components/Field";
import { getMyProfile, saveMyProfile, uploadAvatar, myDiplomas, uploadDiploma, deleteDiploma, SpecialistProfile } from "../../api/specialist";
import { getSkills, getSpecializations, LookupItem } from "../../api/lookups";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { fileFromAsset } from "../../api/form";
import { LinearGradient } from "expo-linear-gradient";

type SectionKey = "main" | "tax" | "diplomas";

export default function SpecialistProfileScreen() {
  // data
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<SectionKey | null>(null);
  const [profile, setProfile] = useState<SpecialistProfile | null>(null);

  // form
  const [about, setAbout] = useState(""); const [city, setCity] = useState("");
  const [addr1, setAddr1] = useState(""); const [price, setPrice] = useState<string>("");
  const [phone, setPhone] = useState(""); const [telegram, setTelegram] = useState("");
  const [avatarMime, setAvatarMime] = useState<string | undefined>();

  // taxonomies
  const [specs, setSpecs] = useState<LookupItem[]>([]);
  const [skills, setSkillsList] = useState<LookupItem[]>([]);
  const [selSpecs, setSelSpecs] = useState<number[]>([]);
  const [selSkills, setSelSkills] = useState<number[]>([]);

  // diplomas
  const [diplomas, setDiplomas] = useState<Array<{ id: string; title?: string; fileName?: string; mimeType?: string; uploadedAtUtc: string }>>([]);

  // UI
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({ main: true, tax: true, diplomas: true });

  useEffect(() => {
    (async () => {
      try {
        const [p, sp, sk, dps] = await Promise.all([
          getMyProfile().catch(()=>null),
          getSpecializations(),
          getSkills(),
          myDiplomas().catch(()=>[])
        ]);
        setSpecs(sp.filter(s=>s.isActive).sort((a,b)=>a.sortOrder-b.sortOrder));
        setSkillsList(sk.filter(s=>s.isActive).sort((a,b)=>a.sortOrder-b.sortOrder));
        if (p) {
          setProfile(p);
          setAbout(p.about || ""); setCity(p.city || ""); setAddr1(p.addressLine1 || "");
          setPrice(p.pricePerHour != null ? String(p.pricePerHour) : "");
          setPhone(p.phone || ""); setTelegram(p.telegram || "");
          setAvatarMime(p.avatarMimeType || undefined);
          setSelSpecs(p.specializationIds || []); setSelSkills(p.skillIds || []);
        }
        setDiplomas(dps);
      } finally { setLoading(false); }
    })();
  }, []);

  const progress = useMemo(() => {
    const checks = [
      city.length>0, addr1.length>0, about.length>0,
      selSpecs.length>0, selSkills.length>0, diplomas.length>0
    ];
    const done = checks.filter(Boolean).length;
    return Math.round(done / checks.length * 100);
  }, [city, addr1, about, selSpecs, selSkills, diplomas]);

  const statusPill = () => {
    const s = profile?.status; // 0=Pending 1=Approved 2=Rejected (у тебя enum может отличаться — поправь цвета)
    const map: any = {
      0: { bg:"#FFF8E1", text:"#8A6D1A", label:"Модерация" },
      1: { bg:"#E8F5E9", text:"#256029", label:"Одобрен" },
      2: { bg:"#FEE2E2", text:"#9B1C1C", label:"Отклонён" },
    };
    const p = map[s ?? 0];
    return (
      <View style={{ backgroundColor:p.bg, paddingVertical:6, paddingHorizontal:10, borderRadius: 999 }}>
        <Text style={{ color:p.text, fontWeight:"700" }}>{p.label}</Text>
      </View>
    );
  };

  const saveMain = async () => {
    try {
      setBusy("main");
      const saved = await saveMyProfile({
        about, countryCode:"KZ", city, addressLine1: addr1, isEmailPublic:false,
        pricePerHour: price ? Number(price) : undefined, phone: phone || undefined, telegram: telegram || undefined
      });
      setProfile(saved);
      Alert.alert("Сохранено", "Профиль обновлён и отправлен на модерацию");
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось сохранить профиль");
    } finally { setBusy(null); }
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (!res.canceled) {
      try {
        setBusy("main");
        const file = fileFromAsset({ uri: res.assets[0].uri, fileName: res.assets[0].fileName ?? undefined, mimeType: res.assets[0].mimeType ?? undefined });
        const upd = await uploadAvatar(file);
        setAvatarMime(upd.avatarMimeType || undefined);
        Alert.alert("Готово", "Аватар загружен (на модерации)");
      } catch (e:any) {
        Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось загрузить аватар");
      } finally { setBusy(null); }
    }
  };

  const saveTax = async () => {
    try {
      setBusy("tax");
      const api = (await import("../../api/specialist"));
      await api.setSpecializations(selSpecs);
      await api.setSkills(selSkills);
      Alert.alert("Сохранено", "Специализации и навыки обновлены (на модерации)");
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось сохранить таксономии");
    } finally { setBusy(null); }
  };

  const addDiploma = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: ["application/pdf","image/*"], multiple:false, copyToCacheDirectory:true });
    if (res.canceled || !res.assets?.length) return;
    const a = res.assets[0];
    try {
      setBusy("diplomas");
      await uploadDiploma({ uri:a.uri, name:a.name || "diploma", type:a.mimeType || "application/octet-stream" }, a.name?.split(".")[0], a.name);
      const d = await myDiplomas(); setDiplomas(d);
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось загрузить диплом");
    } finally { setBusy(null); }
  };
  const removeDiploma = async (id: string) => {
    try {
      setBusy("diplomas");
      await deleteDiploma(id);
      const d = await myDiplomas(); setDiplomas(d);
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось удалить диплом");
    } finally { setBusy(null); }
  };

  if (loading) return (
    <Container>
      <Header title="Профиль специалиста" />
      <ActivityIndicator style={{ marginTop: 12 }} />
    </Container>
  );

  return (
    <Container>
      {/* красивый хедер с градиентом, статусом и прогрессом */}
      <LinearGradient colors={[colors.primary, "#4E8630"]} start={{x:0,y:0}} end={{x:1,y:1}} style={{ borderRadius: radius.xl, padding: 18 }}>
        <View style={{ flexDirection:"row", alignItems:"center" }}>
          <View style={{ width:64, height:64, borderRadius:32, backgroundColor:"rgba(255,255,255,0.25)", alignItems:"center", justifyContent:"center", marginRight: 12 }}>
            {/* заглушка иконки; когда появится эндпоинт для получения картинки — подставишь */}
            <Image source={require("../../../assets/icon.png")} style={{ width:30, height:30, opacity:0.85 }} />
          </View>
          <View style={{ flex:1 }}>
            <View style={{ marginTop: 6, flexDirection:"row", alignItems:"center", gap: 8 }}>
              {statusPill()}
              <Text style={{ color:"#E8F5E9", fontSize:12 }}>Заполнено: {progress}%</Text>
            </View>
          </View>
        </View>

        {/* progress bar */}
        <View style={{ height: 8, backgroundColor:"rgba(255,255,255,0.25)", borderRadius: 999, marginTop: 12, overflow:"hidden" }}>
          <View style={{ width:`${progress}%`, height:"100%", backgroundColor:"#fff" }} />
        </View>
      </LinearGradient>

      {/* Основное */}
      <Section
        title="Основная информация"
        subtitle="Город, контакты, о себе и аватар"
        open={open.main}
        onToggle={()=>setOpen(o=>({...o, main: !o.main}))}
      >
        <View style={{ flexDirection:"row", alignItems:"center", gap: 12, marginBottom: 12 }}>
          <View style={{ width:72, height:72, borderRadius:36, backgroundColor:"#EAF6E3", alignItems:"center", justifyContent:"center" }}>
            <Image source={require("../../../assets/icon.png")} style={{ width:36, height:36, opacity:0.4 }} />
          </View>
          <PrimaryButton title={busy==="main" ? "..." : "Загрузить аватар"} onPress={pickAvatar} />
        </View>

        <Field label="Город" value={city} onChangeText={setCity} />
        <Field label="Адрес" value={addr1} onChangeText={setAddr1} />
        <Field label="Телефон" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Telegram" value={telegram} onChangeText={setTelegram} />
        <Field label="О себе" value={about} onChangeText={setAbout} multiline />
        <Field label="Цена за час (₸)" value={price} onChangeText={setPrice} keyboardType="numeric" />

        <PrimaryButton title={busy==="main" ? "Сохраняем..." : "Сохранить профиль"} onPress={saveMain} style={{ marginTop: 6 }} />
      </Section>

      {/* Таксономии */}
      <Section
        title="Специализации и навыки"
        subtitle="Выберите подходящее для каталога и поиска"
        open={open.tax}
        onToggle={()=>setOpen(o=>({...o, tax: !o.tax}))}
      >
        <Text style={{ fontWeight:"700", color: colors.text, marginBottom: 8 }}>Специализации</Text>
        <View style={{ flexDirection:"row", gap:8, flexWrap:"wrap", marginBottom: 12 }}>
          {specs.map(s => (
            <Chip key={s.id} text={s.name} active={selSpecs.includes(s.id)} onPress={()=>setSelSpecs(prev=> prev.includes(s.id)? prev.filter(x=>x!==s.id): [...prev, s.id])} />
          ))}
        </View>
        <Text style={{ fontWeight:"700", color: colors.text, marginBottom: 8 }}>Навыки</Text>
        <View style={{ flexDirection:"row", gap:8, flexWrap:"wrap" }}>
          {skills.map(s => (
            <Chip key={s.id} text={s.name} active={selSkills.includes(s.id)} onPress={()=>setSelSkills(prev=> prev.includes(s.id)? prev.filter(x=>x!==s.id): [...prev, s.id])} />
          ))}
        </View>
        <PrimaryButton title={busy==="tax" ? "Сохраняем..." : "Сохранить выбор"} onPress={saveTax} style={{ marginTop: 12 }} />
      </Section>

      {/* Дипломы */}
      <Section
        title="Дипломы и сертификаты"
        subtitle="PDF/JPG/PNG — хранится в базе (base64)"
        open={open.diplomas}
        onToggle={()=>setOpen(o=>({...o, diplomas: !o.diplomas}))}
      >
        <PrimaryButton title={busy==="diplomas" ? "Загружаем..." : "Загрузить диплом"} onPress={addDiploma} />
        <View style={{ height: 10 }} />
        {diplomas.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>Пока пусто</Text>
        ) : (
          <FlatList
            data={diplomas}
            keyExtractor={i=>String(i.id)}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <View style={{
                borderWidth:1, borderColor:"#E1E7DF", borderRadius:16, padding:12,
                backgroundColor:"#fff", flexDirection:"row", justifyContent:"space-between", alignItems:"center"
              }}>
                <View style={{ flexShrink:1 }}>
                  <Text style={{ fontWeight:"700", color: colors.text }}>{item.title || item.fileName || "Файл"}</Text>
                  <Text style={{ color: colors.textMuted, marginTop: 2 }}>{item.mimeType} • {new Date(item.uploadedAtUtc).toLocaleString()}</Text>
                </View>
                <Text onPress={()=>removeDiploma(String(item.id))} style={{ color: "#D64545", fontWeight:"700" }}>Удалить</Text>
              </View>
            )}
          />
        )}
      </Section>
    </Container>
  );
}
