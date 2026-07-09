import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { StudentTabParamList, StudentUniversitiesStackParamList } from './types';
import { DashboardScreen } from '../screens/student/DashboardScreen';
import { UniversitiesScreen } from '../screens/student/UniversitiesScreen';
import { UniversityDetailScreen } from '../screens/student/UniversityDetailScreen';
import { DocumentsScreen } from '../screens/student/DocumentsScreen';
import { EventsScreen } from '../screens/student/EventsScreen';

const UniversitiesStack = createNativeStackNavigator<StudentUniversitiesStackParamList>();

function UniversitiesStackScreen() {
  const { t } = useTranslation();
  return (
    <UniversitiesStack.Navigator>
      <UniversitiesStack.Screen
        name="UniversitiesList"
        component={UniversitiesScreen}
        options={{ headerShown: false }}
      />
      <UniversitiesStack.Screen
        name="UniversityDetail"
        component={UniversityDetailScreen}
        options={{ title: t('student.universities') }}
      />
    </UniversitiesStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<StudentTabParamList>();

export function StudentNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: t('student.dashboard'), tabBarButtonTestID: 'student-tab-dashboard' }}
      />
      <Tab.Screen
        name="Universities"
        component={UniversitiesStackScreen}
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
