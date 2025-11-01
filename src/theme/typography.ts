import { Platform } from "react-native";
const fontRegular = Platform.select({ ios: "System", android: "Roboto", default: "System" });
const fontBold    = Platform.select({ ios: "System", android: "Roboto", default: "System" });

export const type = {
  h1: { fontFamily: fontBold,   fontSize: 28, lineHeight: 34, fontWeight: "700" as const },
  h2: { fontFamily: fontBold,   fontSize: 22, lineHeight: 28, fontWeight: "700" as const },
  h3: { fontFamily: fontBold,   fontSize: 18, lineHeight: 24, fontWeight: "700" as const },
  body: { fontFamily: fontRegular, fontSize: 16, lineHeight: 22, fontWeight: "400" as const },
  caption: { fontFamily: fontRegular, fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
};
