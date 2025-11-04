import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/AppTheme";

// ====== AUTH ======
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

// ====== SPECIALIST ======
import SpecialistHomeScreen from "../screens/specialist/SpecialistHomeScreen";
import ProfileScreen from "../screens/specialist/ProfileScreen";
import ScheduleWizardScreen from "../screens/specialist/ScheduleWizardScreen";
import SkillsScreen from "../screens/specialist/SkillsScreen";
import DiplomasScreen from "../screens/specialist/DiplomasScreen";
import BookingsScreen from "../screens/specialist/BookingsScreen";
import SpecialistProfileScreen from "../screens/specialist/SpecialistProfileScreen";

// ====== PARENT ======
import ParentHomeScreen from "../screens/parent/ParentHomeScreen";
import ParentCatalogScreen from "../screens/parent/ParentCatalogScreen";
import ParentBookingsScreen from "../screens/parent/ParentBookingsScreen";
import ParentStack from "../navigation/ParentStack";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/* ============================================================
   SPECIALIST TABS
   ============================================================ */
function SpecialistTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#999",
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, any> = {
            Home: "leaf",
            Schedule: "calendar",
            Profile: "person",
            Bookings: "clipboard",
          };
          return <Ionicons name={map[route.name] || "ellipse"} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={SpecialistHomeScreen} options={{ title: "Главная" }} />
      <Tab.Screen name="Schedule" component={ScheduleWizardScreen} options={{ title: "Расписание" }} />
      <Tab.Screen name="Bookings" component={BookingsScreen} options={{ title: "Брони" }} />
      <Tab.Screen name="Profile" component={SpecialistProfileScreen} options={{ title: "Профиль" }} />
    </Tab.Navigator>
  );
}

/* ============================================================
   PARENT TABS
   ============================================================ */
function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#99A29E",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#EAEFE8" },
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, any> = {
            ParentCatalog: "leaf",
            ParentBookings: "calendar",
          };
          return <Ionicons name={map[route.name] || "ellipse"} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen
        name="ParentCatalog"
        component={ParentCatalogScreen}
        options={{ title: "Специалисты" }}
      />
      <Tab.Screen
        name="ParentBookings"
        component={ParentBookingsScreen}
        options={{ title: "Мои записи" }}
      />
      <Tab.Screen name="ParentHome" component={ParentStack} options={{ title: "Семья" }} />
    </Tab.Navigator>
  );
}
/* ============================================================
   ROOT NAVIGATOR
   ============================================================ */
export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const isSpec = !!user?.roles?.includes("Specialist");
  const isParent = !!user?.roles?.includes("Parent");

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
        }}
      >
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Вход" }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: "Регистрация" }} />
          </>
        ) : isSpec ? (
          <Stack.Screen name="Specialist" component={SpecialistTabs} options={{ headerShown: false }} />
        ) : isParent ? (
          <Stack.Screen name="Parent" component={ParentTabs} options={{ headerShown: false }} />
        ) : (
          <Stack.Screen
            name="Unknown"
            component={() => (
              <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="alert" size={48} color="red" />
              </View>
            )}
            options={{ title: "Ошибка роли" }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
