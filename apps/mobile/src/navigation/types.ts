import type { NavigatorScreenParams } from '@react-navigation/native';
import type { ProfileFieldKey } from '../features/profile/fields';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
};

/**
 * The student's five designed tabs: Inicio · Universidades · Eventos ·
 * Mis aplicaciones · Mi perfil — matching the designer's bottom bar.
 *
 * Two screens are deliberately *not* tabs: Documents (reached from the
 * dashboard's quick-access grid) and Consejero, which lost its tab to
 * Applications. The counselor stays one tap away through the dashboard's
 * highlight card and the WhatsApp CTAs on Applications, so it lives in the Home
 * stack instead — five is the most a Spanish-labeled tab bar fits legibly on a
 * small phone.
 *
 * Tabs holding a stack use `NavigatorScreenParams` so cross-tab jumps stay
 * type-safe (e.g. `navigate('Events', { screen: 'EventDetail', … })`).
 */
export type StudentTabParamList = {
  Home: NavigatorScreenParams<StudentHomeStackParamList>;
  Universities: NavigatorScreenParams<StudentUniversitiesStackParamList>;
  Events: NavigatorScreenParams<StudentEventsStackParamList>;
  Applications: undefined;
  Profile: NavigatorScreenParams<StudentProfileStackParamList>;
};

/** Features that aren't built yet and route to the shared "coming soon" screen. */
export type ComingSoonFeature = 'learning' | 'resources' | 'benefits';

export type StudentHomeStackParamList = {
  HomeMain: undefined;
  Documents: undefined;
  Counselor: undefined;
  Notifications: undefined;
  ComingSoon: { feature: ComingSoonFeature };
};

export type StudentProfileStackParamList = {
  ProfileHome: undefined;
  /**
   * `focus` names the field the edit form should scroll to (and focus, when it's
   * a text input) — set when the student taps a specific profile row rather than
   * the general "Editar" button.
   */
  ProfileEdit: { focus?: ProfileFieldKey } | undefined;
};

// Student-facing university browsing (distinct from the admin UniversitiesStack).
export type StudentUniversitiesStackParamList = {
  UniversitiesList: undefined;
  UniversityDetail: { universityId: string };
};

export type StudentEventsStackParamList = {
  EventsList: undefined;
  EventDetail: { eventId: string };
};

export type StudentsStackParamList = {
  StudentsList: undefined;
  StudentDetail: { studentId?: string };
};

export type HighSchoolsStackParamList = {
  List: undefined;
  Detail: { id?: string };
};

export type UniversitiesStackParamList = {
  List: undefined;
  Detail: { id?: string };
};

export type AdminEventsStackParamList = {
  List: undefined;
  Detail: { id?: string };
};

export type CounselorsStackParamList = {
  List: undefined;
  Detail: { id?: string };
};

export type SponsorsStackParamList = {
  List: undefined;
  Detail: { id?: string };
};

export type AdminTabParamList = {
  Students: undefined;
  HighSchools: undefined;
  Universities: undefined;
  Counselors: undefined;
  Events: undefined;
  Sponsors: undefined;
};

export type CounselorTabParamList = {
  Students: undefined;
};

export type CounselorStudentsStackParamList = {
  StudentsList: undefined;
  StudentDetail: { studentId: string };
};
