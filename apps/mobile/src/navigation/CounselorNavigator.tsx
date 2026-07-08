import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import type { CounselorStudentsStackParamList, CounselorTabParamList } from './types';
import { StudentsScreen } from '../screens/counselor/StudentsScreen';
import { StudentDetailScreen } from '../screens/counselor/StudentDetailScreen';

const StudentsStack = createNativeStackNavigator<CounselorStudentsStackParamList>();

function StudentsStackScreen() {
  const { t } = useTranslation();
  return (
    <StudentsStack.Navigator>
      <StudentsStack.Screen
        name="StudentsList"
        component={StudentsScreen}
        options={{ headerShown: false }}
      />
      <StudentsStack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ title: t('counselor.student') }}
      />
    </StudentsStack.Navigator>
  );
}

const Tab = createBottomTabNavigator<CounselorTabParamList>();

export function CounselorNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Students"
        component={StudentsStackScreen}
        options={{ title: t('counselor.students') }}
      />
    </Tab.Navigator>
  );
}
