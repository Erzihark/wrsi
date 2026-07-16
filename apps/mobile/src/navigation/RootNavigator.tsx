import { ActivityIndicator, View } from "react-native";
import { useTheme } from "@wrsi/ui";
import { useAuth } from "../auth/AuthContext";
import { AuthNavigator } from "./AuthNavigator";
import { StudentGate } from "./StudentGate";
import { CounselorNavigator } from "./CounselorNavigator";
import { AdminNavigator } from "./AdminNavigator";
import { AppHeaderShell } from "./AppHeader";

/**
 * Root auth switch: shows a splash while resolving the session, then mounts the
 * navigator for the signed-in user's experience.
 *
 * Staff (admin/counselor) sit under the shared `AppHeader`, which owns their
 * global Log-out. The student experience brings its own designed header, so
 * `StudentGate` renders unwrapped and keeps the real safe-area insets.
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

  if (experience === "admin" || experience === "counselor") {
    return (
      <AppHeaderShell>
        {experience === "admin" ? <AdminNavigator /> : <CounselorNavigator />}
      </AppHeaderShell>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.color.background }}>
      <StudentGate />
    </View>
  );
}
