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

export type StudentsStackParamList = {
  StudentsList: undefined;
  StudentDetail: { studentId: string };
};

export type AdminTabParamList = {
  Students: undefined;
};

export type CounselorTabParamList = {
  Students: undefined;
};
