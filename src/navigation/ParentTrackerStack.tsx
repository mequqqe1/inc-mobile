import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TrackerCalendarScreen from "../screens/parent/TrackerCalendarScreen";
import TrackerDayScreen from "../screens/parent/TrackerDayScreen";

const Stack = createNativeStackNavigator();

export default function ParentTrackerStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
      <Stack.Screen
        name="TrackerCalendar"
        component={TrackerCalendarScreen}
        options={{ title: "Трекер" }}
      />
      <Stack.Screen
        name="TrackerDay"
        component={TrackerDayScreen}
        options={{ title: "День" }}
      />
    </Stack.Navigator>
  );
}
