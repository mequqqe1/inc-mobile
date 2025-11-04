import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Card, PrimaryButton } from "../../components/Ui";
import { ChildDocument, listDocuments, uploadPdf, downloadPdf, deleteDocument } from "../../api/parent/documents";
import { fileToBase64 } from "../../utils/base64";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";

export default function ChildDocumentsScreen() {
  const { params } = useRoute<any>();
  const childId: string = params.childId;
  const [docs, setDocs] = useState<ChildDocument[]>([]);

  const load = async () => setDocs(await listDocuments(childId));
  useEffect(() => { load(); }, [childId]);

  const pickAndUpload = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: "application/pdf" });
    if (res.canceled || !res.assets?.[0]) return;
    const a = res.assets[0];
    const base64 = await fileToBase64(a.uri);
    await uploadPdf(childId, a.name || "document.pdf", base64, a.size);
    await load();
  };

  const download = async (doc: ChildDocument) => {
    const buf = await downloadPdf(childId, doc.id);
    const b64 = `data:application/pdf;base64,${Buffer.from(buf).toString("base64")}`;
    const fileUri = FileSystem.cacheDirectory + doc.fileName;
    await FileSystem.writeAsStringAsync(fileUri, b64.replace(/^data:application\/pdf;base64,/, ""), { encoding: FileSystem.EncodingType.Base64 });
    Alert.alert("Скачано", `Файл сохранён: ${fileUri}`);
  };

  return (
    <View style={{ flex:1, padding:16 }}>
      <PrimaryButton title="Загрузить PDF" onPress={pickAndUpload} />

      <FlatList
        style={{ marginTop: 12 }}
        data={docs}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontWeight: "700" }}>{item.fileName}</Text>
                <Text style={{ fontSize: 12, color: "#7b7b7b" }}>
                  {(item.sizeBytes / 1024 / 1024).toFixed(2)} MB • {new Date(item.createdAtUtc).toLocaleString()}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <TouchableOpacity onPress={() => download(item)} style={{ marginRight: 12 }}>
                  <Ionicons name="download-outline" size={22} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteDocument(childId, item.id).then(load)}>
                  <Ionicons name="trash-outline" size={22} color="#D33" />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}
