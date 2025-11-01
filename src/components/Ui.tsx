import React from "react";
import { Text, TouchableOpacity, View, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, shadow } from "../theme/AppTheme";
import { Pressable } from "react-native";


// Solid кнопка
export const PrimaryButton = ({ title, onPress, style }: { title: string; onPress?: () => void; style?: ViewStyle }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.btn, style]}>
    <Text style={styles.btnText}>{title}</Text>
  </TouchableOpacity>
);

// Прозрачная c бордером
export const OutlineButton = ({ title, onPress, style }: { title: string; onPress?: () => void; style?: ViewStyle }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={[styles.btnOutline, style]}>
    <Text style={styles.btnOutlineText}>{title}</Text>
  </TouchableOpacity>
);

// Card
export const Card = ({ children, style }: { children: React.ReactNode; style?: ViewStyle }) => (
  <View style={[styles.card, style]}>{children}</View>
);

// Chip (тэг)
export const Chip = ({ text, active=false, style, onPress }:{
  text: string; active?: boolean; style?: any; onPress?: ()=>void
}) => (
  <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: colors.primarySoft, borderColor: colors.primary }, style]}>
    <Text style={[styles.chipText, active && { color: colors.primary }]}>{text}</Text>
  </Pressable>
);

// Большой баннер с градиентом
export const Hero = ({ title, subtitle, cta, onPress }: { title: string; subtitle?: string; cta?: string; onPress?: () => void }) => (
  <LinearGradient colors={[colors.primary, colors.primaryDark]} start={{x:0,y:0}} end={{x:1,y:1}} style={styles.hero}>
    <Text style={[styles.heroTitle]}>{title}</Text>
    {!!subtitle && <Text style={styles.heroSubtitle}>{subtitle}</Text>}
    {!!cta && <OutlineButton title={cta} onPress={onPress} style={{ marginTop: 12, borderColor: "#fff" }} />}
  </LinearGradient>
);

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 12, paddingHorizontal: 18,
    borderRadius: radius.lg,
    alignItems: "center", justifyContent: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  btnOutline: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  btnOutlineText: { color: colors.primary, fontWeight: "700", fontSize: 16 },

  card: {
    backgroundColor: colors.card, borderRadius: radius.lg, padding: 14,
    borderWidth: 1, borderColor: colors.stroke, ...shadow.card,
  },

  chip: {
    borderWidth: 1, borderColor: colors.stroke, backgroundColor: "#fff",
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.md,
  },
  chipText: { color: colors.textMuted, fontWeight: "600" },

  hero: {
    borderRadius: radius.xl, padding: 20, ...shadow.soft,
  },
  heroTitle: { color:"#fff", fontSize:24, fontWeight:"800" },
  heroSubtitle: { color:"#F2F8EF", marginTop:6, fontSize:14 },
});
