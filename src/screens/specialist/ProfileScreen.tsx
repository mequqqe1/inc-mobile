import React, { useEffect, useState } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, PrimaryButton } from "../../components/Ui";
import { Text, TextInput, Image, View, Alert } from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import { getMyProfile, saveMyProfile, uploadAvatar } from "../../api/specialist";
import * as ImagePicker from "expo-image-picker";
import { fileFromAsset } from "../../api/form";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(""); const [addr, setAddr] = useState("");
  const [about, setAbout] = useState(""); const [avatarMime, setAvatarMime] = useState<string|undefined>();
  const [price, setPrice] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const p = await getMyProfile();
        setCity(p.city || ""); setAddr(p.addressLine1 || ""); setAbout(p.about || "");
        setAvatarMime(p.avatarMimeType || undefined);
        setPrice(p.pricePerHour != null ? String(p.pricePerHour) : "");
      } catch (e:any) {
        // если профиля ещё нет — форма пустая, ок
      } finally { setLoading(false); }
    })();
  }, []);

  const save = async () => {
    try {
      await saveMyProfile({
        about, countryCode:"KZ", city, addressLine1: addr, isEmailPublic:false,
        pricePerHour: price ? Number(price) : undefined
      });
      Alert.alert("Сохранено", "Профиль обновлён и отправлен на модерацию");
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось сохранить профиль");
    }
  };

  const pickAvatar = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.9 });
    if (!res.canceled) {
      try {
        const file = fileFromAsset({
  ...res.assets[0],
  fileName: res.assets[0].fileName ?? undefined,
});
        const updated = await uploadAvatar(file);
        setAvatarMime(updated.avatarMimeType || undefined);
        Alert.alert("Готово", "Аватар загружен (на модерации)");
      } catch (e:any) {
        Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось загрузить аватар");
      }
    }
  };

  if (loading) return null;

  return (
    <Container>
      <Header title="Профиль" subtitle="Заполните основные данные" />
      <Card>
        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Город</Text>
        <TextInput value={city} onChangeText={setCity}
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12, marginBottom:12 }} />
        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Адрес</Text>
        <TextInput value={addr} onChangeText={setAddr}
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12, marginBottom:12 }} />
        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>О себе</Text>
        <TextInput value={about} onChangeText={setAbout} multiline
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12, minHeight:90 }} />
        <Text style={{ color: colors.textMuted, marginTop:12, marginBottom: 6 }}>Цена за час (тенге)</Text>
        <TextInput value={price} onChangeText={setPrice} keyboardType="numeric"
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12 }} />

        <PrimaryButton title="Сохранить" onPress={save} style={{ marginTop: 14 }} />
      </Card>

      <Card>
        <Text style={{ fontWeight:"800", fontSize:16, color: colors.text, marginBottom: 8 }}>Аватар</Text>
        <View style={{ flexDirection:"row", alignItems:"center", gap: 12 }}>
          <View style={{ width:72, height:72, borderRadius:36, backgroundColor:"#EAF6E3", alignItems:"center", justifyContent:"center" }}>
            {/* Placeholder круга; при желании можно отрендерить data-uri, если будет эндпоинт */}
            <Image source={require("../../../assets/icon.png")} style={{ width:36, height:36, opacity:0.4 }} />
          </View>
          <PrimaryButton title="Загрузить фото" onPress={pickAvatar} />
        </View>
      </Card>
    </Container>
  );
}
