import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import type { AdminTabParamList, StudentsStackParamList } from './types';
import { StudentsListScreen } from '../screens/admin/StudentsListScreen';
import { StudentDetailScreen } from '../screens/admin/StudentDetailScreen';

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

const Tab = createBottomTabNavigator<AdminTabParamList>();

/**
 * Admin/super-admin experience: a dedicated management section. One tab per
 * manageable table — Students today; Counselors / High Schools / Universities
 * slot in as sibling tabs as they're built.
 */
export function AdminNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Students"
        component={StudentsManagement}
        options={{ title: t('admin.students') }}
      />
    </Tab.Navigator>
  );
}
