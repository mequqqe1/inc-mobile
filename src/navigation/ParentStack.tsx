import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ChildrenListScreen from "../screens/parent/ChildrenListScreen";
import ChildFormScreen from "../screens/parent/ChildFormScreen";
import ChildNotesScreen from "../screens/parent/ChildNotesScreen";
import ChildDocumentsScreen from "../screens/parent/ChildDocumentsScreen";
import CaregiversScreen from "../screens/parent/CaregiversScreen";

const Stack = createNativeStackNavigator();

export default function ParentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen name="ChildrenList" component={ChildrenListScreen} options={{ title: "Мои дети" }} />
      <Stack.Screen name="ChildForm" component={ChildFormScreen} options={{ title: "Карточка ребёнка" }} />
      <Stack.Screen name="ChildNotes" component={ChildNotesScreen} options={{ title: "Заметки" }} />
      <Stack.Screen name="ChildDocs" component={ChildDocumentsScreen} options={{ title: "Документы" }} />
      <Stack.Screen name="Caregivers" component={CaregiversScreen} options={{ title: "Члены семьи" }} />
    </Stack.Navigator>
  );
}
