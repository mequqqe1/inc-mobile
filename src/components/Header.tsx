import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, radius } from "../theme/AppTheme";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.row}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  title: { fontSize:22, fontWeight:"800", color: colors.text },
  subtitle: { color: colors.textMuted, marginTop: 4 },
});
