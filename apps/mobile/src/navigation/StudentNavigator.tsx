import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import type { StudentTabParamList } from './types';
import { DashboardScreen } from '../screens/student/DashboardScreen';
import { UniversitiesScreen } from '../screens/student/UniversitiesScreen';
import { DocumentsScreen } from '../screens/student/DocumentsScreen';
import { EventsScreen } from '../screens/student/EventsScreen';

const Tab = createBottomTabNavigator<StudentTabParamList>();

export function StudentNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t('student.dashboard') }}
      />
      <Tab.Screen
        name="Universities"
        component={UniversitiesScreen}
        options={{ title: t('student.universities') }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{ title: t('student.documents') }}
      />
      <Tab.Screen
        name="Events"
        component={EventsScreen}
        options={{ title: t('student.events') }}
      />
    </Tab.Navigator>
  );
}
