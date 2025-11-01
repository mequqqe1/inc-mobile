import React, { useEffect, useState } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, Chip, PrimaryButton } from "../../components/Ui";
import { Text, View, Alert, ActivityIndicator } from "react-native";
import { colors } from "../../theme/AppTheme";
import { getSpecializations, getSkills, LookupItem } from "../../api/lookups";
import { getMyProfile, setSkills, setSpecializations } from "../../api/specialist";

export default function SkillsScreen() {
  const [loading, setLoading] = useState(true);
  const [specs, setSpecs] = useState<LookupItem[]>([]);
  const [skills, setSkillsList] = useState<LookupItem[]>([]);
  const [selSpecs, setSelSpecs] = useState<number[]>([]);
  const [selSkills, setSelSkills] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [sp, sk, profile] = await Promise.all([
          getSpecializations(),
          getSkills(),
          getMyProfile().catch(()=>null)
        ]);
        setSpecs(sp.filter(s=>s.isActive).sort((a,b)=>a.sortOrder-b.sortOrder));
        setSkillsList(sk.filter(s=>s.isActive).sort((a,b)=>a.sortOrder-b.sortOrder));
        if (profile) {
          setSelSpecs(profile.specializationIds || []);
          setSelSkills(profile.skillIds || []);
        }
      } catch (e:any) {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  const toggle = (arr: number[], setArr: (v:number[])=>void, id:number) => {
    setArr(arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);
  };

  const saveAll = async () => {
    try {
      setBusy(true);
      await setSpecializations(selSpecs);
      await setSkills(selSkills);
      Alert.alert("Сохранено", "Выбор обновлён (профиль отправлен на модерацию)");
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось сохранить");
    } finally { setBusy(false); }
  };

  if (loading) {
    return (
      <Container>
        <Header title="Навыки и специализации" />
        <ActivityIndicator style={{ marginTop: 12 }} />
      </Container>
    );
  }

  return (
    <Container>
      <Header title="Навыки и специализации" subtitle="Выберите из списка" />

      <Card>
        <Text style={{ fontWeight:"800", fontSize:16, color: colors.text, marginBottom: 8 }}>Специализации</Text>
        <View style={{ flexDirection:"row", gap:8, flexWrap:"wrap" }}>
          {specs.map(s => (
         <Chip text={s.name} active={selSpecs.includes(s.id)} onPress={() => toggle(selSpecs, setSelSpecs, s.id)} />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={{ fontWeight:"800", fontSize:16, color: colors.text, marginBottom: 8 }}>Навыки</Text>
        <View style={{ flexDirection:"row", gap:8, flexWrap:"wrap" }}>
          {skills.map(s => (
            <Chip text={s.name} active={selSpecs.includes(s.id)} onPress={() => toggle(selSpecs, setSelSpecs, s.id)} />
          ))}
        </View>
        <PrimaryButton title={busy ? "Сохраняем..." : "Сохранить выбор"} onPress={saveAll} style={{ marginTop: 12 }} />
      </Card>
    </Container>
  );
}
