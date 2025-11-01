import React from "react";
import { View, Text, Pressable } from "react-native";
import { colors, radius, shadow } from "../theme/AppTheme";

export default function Section({
  title, subtitle, open, onToggle, children
}: { title: string; subtitle?: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor:"#fff", borderRadius: radius.xl, padding: 14, borderWidth:1, borderColor:"#E1E7DF", ...shadow.card }}>
      <Pressable onPress={onToggle} style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom: open ? 10 : 0 }}>
        <View style={{ flexShrink:1 }}>
          <Text style={{ fontSize:16, fontWeight:"800", color: colors.text }}>{title}</Text>
          {!!subtitle && <Text style={{ color: colors.textMuted, marginTop: 2 }}>{subtitle}</Text>}
        </View>
        <Text style={{ color: colors.primary, fontWeight:"700" }}>{open ? "Свернуть" : "Развернуть"}</Text>
      </Pressable>
      {open && children}
    </View>
  );
}
