import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import type { CounselorTabParamList } from './types';
import { StudentsScreen } from '../screens/counselor/StudentsScreen';

const Tab = createBottomTabNavigator<CounselorTabParamList>();

export function CounselorNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{ title: t('counselor.students') }}
      />
    </Tab.Navigator>
  );
}
