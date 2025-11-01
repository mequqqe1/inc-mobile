import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, StyleSheet } from "react-native";
import { colors } from "../theme/AppTheme";

export default function Container({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={styles.wrap}>{children}</ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16 }
});
