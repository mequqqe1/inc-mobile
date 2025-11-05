import React, { useState } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, PrimaryButton, Chip } from "../../components/Ui";
import { TextInput, View, Alert, Text } from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import { useAuth } from "../../context/AuthContext";

export default function RegisterScreen() {
  const { register } = useAuth();
  const [role, setRole] = useState<"Specialist"|"Parent">("Parent");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    try {
      setBusy(true);
      await register(email.trim(), password, role, fullName || undefined);
    } catch (e: any) {
      const msg = e?.response?.data?.errors ?? e?.response?.data?.error ?? "Не удалось зарегистрироваться";
      Alert.alert("Ошибка регистрации", Array.isArray(msg) ? msg.join("\n") : msg);
    } finally { setBusy(false); }
  };

  return (
    <Container>
      <Header title="Регистрация" subtitle="Создайте аккаунт" />
      <Card>
        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Роль</Text>
        <View style={{ flexDirection:"row", gap: 8, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            <Chip
              text="Родитель"
              active={role === "Parent"}
              onPress={() => setRole("Parent")}
            />
            <Chip
              text="Специалист"
              active={role === "Specialist"}
              onPress={() => setRole("Specialist")}
            />
          </View>

        </View>

        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>ФИО (необязательно)</Text>
        <TextInput value={fullName} onChangeText={setFullName}
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12, marginBottom:12 }} />

        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Email</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12, marginBottom:12 }} />

        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Пароль</Text>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12 }} />

        <PrimaryButton title={busy? "Создаём..." : "Создать аккаунт"} onPress={submit} style={{ marginTop: 14 }} />
      </Card>
    </Container>
  );
}
