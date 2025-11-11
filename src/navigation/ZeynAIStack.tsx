import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ZeynAIConversationsScreen from "../screens/parent/ZeynAIConversationsScreen";
import ZeynAIChatScreen from "../screens/parent/ZeynAIChatScreen";

export type ZeynAIStackParamList = {
  ZeynAIConversations: undefined;
  ZeynAIChat: { conversationId: string; title?: string };
};

const Stack = createNativeStackNavigator<ZeynAIStackParamList>();

export default function ZeynAIStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ZeynAIConversations"
        component={ZeynAIConversationsScreen}
        options={{ title: "Чаты ZeynAI" }}
      />
      <Stack.Screen
        name="ZeynAIChat"
        component={ZeynAIChatScreen}
        options={({ route }) => ({ title: route.params?.title || "Чат" })}
      />
    </Stack.Navigator>
  );
}
