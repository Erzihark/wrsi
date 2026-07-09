export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

export type StudentTabParamList = {
  Dashboard: undefined;
  Universities: undefined;
  Documents: undefined;
  Events: undefined;
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

export type AdminTabParamList = {
  Students: undefined;
  HighSchools: undefined;
  Universities: undefined;
  Events: undefined;
};

export type CounselorTabParamList = {
  Students: undefined;
};

export type CounselorStudentsStackParamList = {
  StudentsList: undefined;
  StudentDetail: { studentId: string };
};
