import React from "react";
import { View, Text, TextInput, TextInputProps } from "react-native";
import { colors, radius } from "../theme/AppTheme";

export function Field({
  label, error, multiline, ...rest
}: { label: string; error?: string; multiline?: boolean } & TextInputProps) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: colors.textMuted, marginBottom: 6 }}>{label}</Text>
      <TextInput
        {...rest}
        multiline={multiline}
        style={{
          borderWidth:1, borderColor: error ? "#F45B69" : "#E1E7DF",
          borderRadius: radius.lg, padding:12, minHeight: multiline ? 90 : undefined,
          backgroundColor:"#fff"
        }}
      />
      {!!error && <Text style={{ color:"#F45B69", marginTop: 4 }}>{error}</Text>}
    </View>
  );
}
