import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TextInput } from "react-native";
import { Card, PrimaryButton } from "../../components/Ui";
import { colors, radius } from "../../theme/AppTheme";
import { listChildNotes, addChildNote, ChildNote } from "../../api/parent/notes";
import { useRoute } from "@react-navigation/native";

export default function ChildNotesScreen() {
  const { params } = useRoute<any>();
  const childId: string = params.childId;
  const [items, setItems] = useState<ChildNote[]>([]);
  const [text, setText] = useState("");

  const load = async () => setItems(await listChildNotes(childId));
  useEffect(() => { load(); }, [childId]);

  const add = async () => {
    if (!text.trim()) return;
    await addChildNote(childId, text.trim());
    setText("");
    await load();
  };

  return (
    <View style={{ flex:1, padding:16 }}>
      <Card>
        <TextInput placeholder="Новая заметка..." value={text} onChangeText={setText}
          style={{ borderWidth:1,borderColor:"#E5E9E6",borderRadius:radius.lg,padding:10,backgroundColor:"#fff" }}/>
        <PrimaryButton title="Добавить" onPress={add} style={{ marginTop: 8 }} />
      </Card>

      <FlatList
        style={{ marginTop: 12 }}
        data={items}
        keyExtractor={(x) => x.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8 }}>
            <Text style={{ color: colors.text }}>{item.text}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 6, fontSize: 12 }}>
              {new Date(item.createdAtUtc).toLocaleString()}
            </Text>
          </Card>
        )}
      />
    </View>
  );
}
