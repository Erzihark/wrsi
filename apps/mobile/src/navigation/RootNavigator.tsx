import { ActivityIndicator, View } from "react-native";
import {
  SafeAreaInsetsContext,
  type EdgeInsets,
} from "react-native-safe-area-context";
import { useTheme } from "@wrsi/ui";
import { useAuth } from "../auth/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { StudentGate } from "./StudentGate";
import { CounselorNavigator } from "./CounselorNavigator";
import { AdminNavigator } from "./AdminNavigator";
import { AppHeader } from "./AppHeader";

/**
 * Root auth switch: shows a splash while resolving the session, then mounts the
 * navigator for the signed-in user's experience (staff CRM vs student), always
 * under a shared top app bar that owns the global Log-out action.
 */
export function RootNavigator() {
  const { session, experience, loading } = useAuth();
  const t = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.color.background,
        }}
      >
        <ActivityIndicator color={t.color.primary} />
      </View>
    );
  }

  if (!session) {
    return <AuthNavigator />;
  }

  const experienceNavigator =
    experience === "admin" ? (
      <AdminNavigator />
    ) : experience === "counselor" ? (
      <CounselorNavigator />
    ) : (
      <StudentGate />
    );

  return (
    <View style={{ flex: 1, backgroundColor: t.color.background }}>
      <AppHeader />
      {/* The AppHeader already consumed the top inset, so zero it for the nested
          navigator to avoid its screen headers double-padding under the notch. */}
      <SafeAreaInsetsContext.Consumer>
        {(insets) => (
          <SafeAreaInsetsContext.Provider
            value={{ ...(insets as EdgeInsets), top: 0 }}
          >
            <View style={{ flex: 1 }}>{experienceNavigator}</View>
          </SafeAreaInsetsContext.Provider>
        )}
      </SafeAreaInsetsContext.Consumer>
    </View>
  );
}
