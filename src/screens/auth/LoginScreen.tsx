import React, { useState } from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, PrimaryButton } from "../../components/Ui";
import { TextInput, Alert, Text } from "react-native";
import { colors, radius } from "../../theme/AppTheme";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    try {
      setBusy(true);
      await login(email.trim(), password);
    } catch (e: any) {
      Alert.alert("Ошибка входа", e?.response?.data?.error ?? "Проверьте email/пароль");
    } finally { setBusy(false); }
  };

  return (
    <Container>
      <Header title="Вход" subtitle="Рады видеть тебя снова" />
      <Card>
        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Email</Text>
        <TextInput
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12, marginBottom:12 }}
        />
        <Text style={{ color: colors.textMuted, marginBottom: 6 }}>Пароль</Text>
        <TextInput
          value={password} onChangeText={setPassword} secureTextEntry
          style={{ borderWidth:1, borderColor:"#E1E7DF", borderRadius:radius.lg, padding:12 }}
        />
        <PrimaryButton title={busy ? "Входим..." : "Войти"} onPress={onSubmit} style={{ marginTop: 14 }} />
      </Card>
      <Text style={{ textAlign:"center", color: colors.textMuted, marginTop: 8 }}>
        Нет аккаунта? <Text onPress={()=>navigation.navigate("Register")} style={{ color: colors.primary, fontWeight:"700" }}>Регистрация</Text>
      </Text>
    </Container>
  );
}
