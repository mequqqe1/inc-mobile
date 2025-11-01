import React, { useEffect, useState } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, PrimaryButton } from "../../components/Ui";
import { Text, View, FlatList, Alert } from "react-native";
import { colors } from "../../theme/AppTheme";
import * as DocumentPicker from "expo-document-picker";
import { Diploma, myDiplomas, uploadDiploma, deleteDiploma } from "../../api/specialist";

export default function DiplomasScreen() {
  const [list, setList] = useState<Diploma[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const data = await myDiplomas();
    setList(data);
  };

  useEffect(() => { load(); }, []);

  const pickAndUpload = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"], multiple: false, copyToCacheDirectory: true
    });
    if (res.canceled || !res.assets?.length) return;
    const asset = res.assets[0];

    try {
      setBusy(true);
      const file = { uri: asset.uri, name: asset.name || "diploma", type: asset.mimeType || "application/octet-stream" };
      await uploadDiploma(file, asset.name?.split(".")[0], asset.name);
      await load();
      Alert.alert("Готово", "Диплом загружен (профиль отправлен на модерацию)");
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось загрузить файл");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    try {
      await deleteDiploma(id);
      await load();
    } catch (e:any) {
      Alert.alert("Ошибка", e?.response?.data?.error ?? "Не удалось удалить");
    }
  };

  return (
    <Container>
      <Header title="Дипломы" subtitle="PDF или изображение, хранится в базе" />

      <Card>
        <PrimaryButton title={busy ? "Загружаем..." : "Загрузить диплом"} onPress={pickAndUpload} />
      </Card>

      <Card>
        <Text style={{ fontWeight:"800", fontSize:16, color: colors.text, marginBottom: 8 }}>Список</Text>
        <FlatList
          data={list}
          keyExtractor={(i)=>String(i.id)}
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
              <Text onPress={()=>remove(String(item.id))} style={{ color: "#D64545", fontWeight:"700" }}>Удалить</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: colors.textMuted }}>Пока пусто</Text>}
        />
      </Card>
    </Container>
  );
}
