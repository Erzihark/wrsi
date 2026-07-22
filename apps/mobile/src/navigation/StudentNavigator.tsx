import { Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import {
  BookIcon,
  CalendarIcon,
  EditIcon,
  FileTextIcon,
  HomeIcon,
  PersonIcon,
  Text,
  useTheme,
} from "@wrsi/ui";
import type {
  StudentEventsStackParamList,
  StudentHomeStackParamList,
  StudentProfileStackParamList,
  StudentTabParamList,
  StudentUniversitiesStackParamList,
} from "./types";
import { StudentHeader } from "./StudentHeader";
import { HomeScreen } from "../screens/student/home/HomeScreen";
import { UniversitiesScreen } from "../screens/student/UniversitiesScreen";
import { UniversityDetailScreen } from "../screens/student/UniversityDetailScreen";
import { DocumentsScreen } from "../screens/student/DocumentsScreen";
import { EventsScreen } from "../screens/student/EventsScreen";
import { EventDetailScreen } from "../screens/student/EventDetailScreen";
import { NotificationsScreen } from "../screens/student/NotificationsScreen";
import { ApplicationsScreen } from "../screens/student/applications/ApplicationsScreen";
import { ComingSoonScreen } from "../screens/student/ComingSoonScreen";
import { CounselorScreen } from "../screens/student/CounselorScreen";
import { ProfileScreen } from "../screens/student/profile/ProfileScreen";
import { ProfileEditScreen } from "../screens/student/profile/ProfileEditScreen";

/**
 * Inicio. Holds the dashboard plus the destinations it links to that aren't
 * tabs of their own: Documents (which left the tab bar for the quick-access
 * grid), Consejero (which gave its tab up to Mis aplicaciones and is reached
 * from the dashboard's highlight card), Notifications (the bell), and the
 * coming-soon placeholder.
 */
const HomeStack = createNativeStackNavigator<StudentHomeStackParamList>();

function HomeStackScreen() {
  const { t } = useTranslation();
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{
          // The navigator hands the header its own `navigation` object — the
          // documented contract for custom headers.
          header: ({ navigation }) => (
            <StudentHeader
              onBellPress={() => navigation.navigate("Notifications")}
              onProfilePress={() =>
                navigation
                  .getParent()
                  ?.navigate("Profile", { screen: "ProfileHome" })
              }
            />
          ),
        }}
      />
      <HomeStack.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: t("student.documents") }}
      />
      <HomeStack.Screen
        name="Counselor"
        component={CounselorScreen}
        options={{ title: t("student.counselor") }}
      />
      <HomeStack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t("notifications.title") }}
      />
      <HomeStack.Screen
        name="ComingSoon"
        component={ComingSoonScreen}
        options={{ title: "" }}
      />
    </HomeStack.Navigator>
  );
}

const UniversitiesStack =
  createNativeStackNavigator<StudentUniversitiesStackParamList>();

function UniversitiesStackScreen() {
  const { t } = useTranslation();
  return (
    <UniversitiesStack.Navigator>
      <UniversitiesStack.Screen
        name="UniversitiesList"
        component={UniversitiesScreen}
        options={{ headerShown: false }}
      />
      <UniversitiesStack.Screen
        name="UniversityDetail"
        component={UniversityDetailScreen}
        options={{ title: t("student.universities") }}
      />
    </UniversitiesStack.Navigator>
  );
}

const EventsStack = createNativeStackNavigator<StudentEventsStackParamList>();

function EventsStackScreen() {
  const { t } = useTranslation();
  return (
    <EventsStack.Navigator>
      <EventsStack.Screen
        name="EventsList"
        component={EventsScreen}
        options={{ headerShown: false }}
      />
      <EventsStack.Screen
        name="EventDetail"
        component={EventDetailScreen}
        options={{ title: t("student.events") }}
      />
    </EventsStack.Navigator>
  );
}

const ProfileStack = createNativeStackNavigator<StudentProfileStackParamList>();

function ProfileStackScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        // This stack owns the Profile headers (the tab's is hidden), so the
        // screen can carry the designed "Editar" action, which opens the form at
        // the top — individual rows deep-link to their own field instead.
        options={({ navigation }) => ({
          title: t("profile.title"),
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              testID="student-profile-edit"
              hitSlop={8}
              onPress={() => navigation.navigate("ProfileEdit")}
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <EditIcon size={22} color={theme.color.brand} />
              <Text
                style={{
                  color: theme.color.brand,
                  fontWeight: theme.fontWeight.semibold,
                }}
              >
                {t("profile.edit")}
              </Text>
            </Pressable>
          ),
        })}
      />
      <ProfileStack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: t("profile.editTitle") }}
      />
    </ProfileStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<StudentTabParamList>();

/**
 * The five designed student tabs: Inicio · Universidades · Eventos ·
 * Mis aplicaciones · Mi perfil.
 *
 * Icons run at 22px (down from 24) and labels at 11px so the longest Spanish
 * labels — "Universidades", "Aplicaciones" — still fit on a 375px-wide phone
 * without ellipsizing now that Applications has joined the bar.
 *
 * Header ownership matters here: the staff `AppHeader` is no longer mounted over
 * this experience, so the real top safe-area inset reaches these navigators and
 * *something* must consume it or content renders under the status bar. Inicio
 * hides the tab header because its stack supplies the branded `StudentHeader`,
 * and Mis aplicaciones hides it because that screen draws the designed heading
 * and consumes the inset itself; the rest keep their header, which handles the
 * inset for free.
 */
export function StudentNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        // Navigation is navy in the brand brief; the orange is reserved for CTAs.
        tabBarActiveTintColor: theme.color.brand,
        tabBarInactiveTintColor: theme.color.textMuted,
        tabBarStyle: { backgroundColor: theme.color.surface },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarItemStyle: { paddingHorizontal: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{
          title: t("student.tabs.home"),
          headerShown: false,
          tabBarButtonTestID: "student-tab-home",
          tabBarIcon: ({ color }) => <HomeIcon size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Universities"
        component={UniversitiesStackScreen}
        options={{
          title: t("student.tabs.universities"),
          tabBarButtonTestID: "student-tab-universities",
          tabBarIcon: ({ color }) => <BookIcon size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Events"
        component={EventsStackScreen}
        options={{
          title: t("student.tabs.events"),
          tabBarButtonTestID: "student-tab-events",
          tabBarIcon: ({ color }) => <CalendarIcon size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Applications"
        component={ApplicationsScreen}
        options={{
          title: t("student.tabs.applications"),
          // The screen renders its own large "Mis aplicaciones" heading, per the
          // design, so a navigator header would just repeat it.
          headerShown: false,
          tabBarButtonTestID: "student-tab-applications",
          tabBarIcon: ({ color }) => <FileTextIcon size={22} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackScreen}
        options={{
          title: t("student.tabs.profile"),
          // The Profile stack renders its own headers (and consumes the inset).
          headerShown: false,
          tabBarButtonTestID: "student-tab-profile",
          tabBarIcon: ({ color }) => <PersonIcon size={22} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
