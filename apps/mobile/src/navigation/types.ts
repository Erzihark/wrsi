import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

/**
 * The student's five designed tabs: Inicio · Universidades · Eventos ·
 * Consejero · Mi perfil. Documents left the tab bar — it's reached from the
 * dashboard's quick-access grid, inside the Home stack. Tabs holding a stack
 * use `NavigatorScreenParams` so cross-tab jumps stay type-safe (e.g. the
 * dashboard's event card → `navigate('Events', { screen: 'EventDetail', … })`).
 */
export type StudentTabParamList = {
  Home: NavigatorScreenParams<StudentHomeStackParamList>;
  Universities: NavigatorScreenParams<StudentUniversitiesStackParamList>;
  Events: NavigatorScreenParams<StudentEventsStackParamList>;
  Counselor: undefined;
  Profile: NavigatorScreenParams<StudentProfileStackParamList>;
};

/** Features that aren't built yet and route to the shared "coming soon" screen. */
export type ComingSoonFeature = 'learning' | 'resources' | 'benefits';

export type StudentHomeStackParamList = {
  HomeMain: undefined;
  Documents: undefined;
  Applications: undefined;
  Notifications: undefined;
  ComingSoon: { feature: ComingSoonFeature };
};

export type StudentProfileStackParamList = {
  ProfileHome: undefined;
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

export type AdminTabParamList = {
  Students: undefined;
  HighSchools: undefined;
  Universities: undefined;
  Counselors: undefined;
  Events: undefined;
};

export type CounselorTabParamList = {
  Students: undefined;
};

export type CounselorStudentsStackParamList = {
  StudentsList: undefined;
  StudentDetail: { studentId: string };
};
