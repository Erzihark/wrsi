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

export type AdminTabParamList = {
  Students: undefined;
  HighSchools: undefined;
  Universities: undefined;
};

export type CounselorTabParamList = {
  Students: undefined;
};
