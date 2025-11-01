import React from "react";
import Container from "../../components/Container";
import Header from "../../components/Header";
import { Card, PrimaryButton } from "../../components/Ui";
import { Text, View } from "react-native";
import { colors } from "../../theme/AppTheme";

export default function SpecialistHomeScreen({ navigation }: any) {
  return (
    <Container>
      <Header title="Специалист" subtitle="Управляйте профилем и расписанием" />
      <Card>
        <Text style={{ fontWeight:"800", fontSize:18, color: colors.text }}>Быстрый старт</Text>
        <View style={{ height: 10 }} />
        <PrimaryButton title="Профиль" onPress={()=>navigation.navigate("Profile")} />
        <View style={{ height: 8 }} />
        <PrimaryButton title="Расписание" onPress={()=>navigation.navigate("Schedule")} />
      </Card>
    </Container>
  );
}
