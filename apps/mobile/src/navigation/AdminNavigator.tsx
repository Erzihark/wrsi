import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import type {
  AdminTabParamList,
  CounselorsStackParamList,
  HighSchoolsStackParamList,
  StudentsStackParamList,
  UniversitiesStackParamList,
} from './types';
import { StudentsListScreen } from '../screens/admin/StudentsListScreen';
import { StudentDetailScreen } from '../screens/admin/StudentDetailScreen';
import { HighSchoolsListScreen } from '../screens/admin/HighSchoolsListScreen';
import { HighSchoolDetailScreen } from '../screens/admin/HighSchoolDetailScreen';
import { UniversitiesListScreen } from '../screens/admin/UniversitiesListScreen';
import { UniversityDetailScreen } from '../screens/admin/UniversityDetailScreen';
import { CounselorsListScreen } from '../screens/admin/CounselorsListScreen';
import { CounselorDetailScreen } from '../screens/admin/CounselorDetailScreen';

const StudentsStack = createNativeStackNavigator<StudentsStackParamList>();

function StudentsManagement() {
  const { t } = useTranslation();
  return (
    <StudentsStack.Navigator>
      <StudentsStack.Screen
        name="StudentsList"
        component={StudentsListScreen}
        options={{ title: t('admin.students') }}
      />
      <StudentsStack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ title: t('admin.editStudent') }}
      />
    </StudentsStack.Navigator>
  );
}

const HighSchoolsStack = createNativeStackNavigator<HighSchoolsStackParamList>();

function HighSchoolsManagement() {
  const { t } = useTranslation();
  return (
    <HighSchoolsStack.Navigator>
      <HighSchoolsStack.Screen
        name="List"
        component={HighSchoolsListScreen}
        options={{ title: t('admin.highSchools') }}
      />
      <HighSchoolsStack.Screen
        name="Detail"
        component={HighSchoolDetailScreen}
        options={{ title: t('admin.highSchool') }}
      />
    </HighSchoolsStack.Navigator>
  );
}

const UniversitiesStack = createNativeStackNavigator<UniversitiesStackParamList>();

function UniversitiesManagement() {
  const { t } = useTranslation();
  return (
    <UniversitiesStack.Navigator>
      <UniversitiesStack.Screen
        name="List"
        component={UniversitiesListScreen}
        options={{ title: t('admin.universities') }}
      />
      <UniversitiesStack.Screen
        name="Detail"
        component={UniversityDetailScreen}
        options={{ title: t('admin.university') }}
      />
    </UniversitiesStack.Navigator>
  );
}

const CounselorsStack = createNativeStackNavigator<CounselorsStackParamList>();

function CounselorsManagement() {
  const { t } = useTranslation();
  return (
    <CounselorsStack.Navigator>
      <CounselorsStack.Screen
        name="List"
        component={CounselorsListScreen}
        options={{ title: t('admin.counselors') }}
      />
      <CounselorsStack.Screen
        name="Detail"
        component={CounselorDetailScreen}
        options={{ title: t('admin.counselor') }}
      />
    </CounselorsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<AdminTabParamList>();

/**
 * Admin/super-admin experience: a dedicated management section, one tab per
 * manageable table (Students, High Schools, Universities, Counselors).
 */
export function AdminNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Students"
        component={StudentsManagement}
        options={{ title: t('admin.students'), tabBarButtonTestID: 'admin-tab-students' }}
      />
      <Tab.Screen
        name="HighSchools"
        component={HighSchoolsManagement}
        options={{ title: t('admin.highSchools') }}
      />
      <Tab.Screen
        name="Universities"
        component={UniversitiesManagement}
        options={{ title: t('admin.universities') }}
      />
      <Tab.Screen
        name="Counselors"
        component={CounselorsManagement}
        options={{ title: t('admin.counselors') }}
      />
    </Tab.Navigator>
  );
}
