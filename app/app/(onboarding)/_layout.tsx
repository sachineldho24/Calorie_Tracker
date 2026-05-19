/**
 * Onboarding Layout — Stack navigator for onboarding flow
 */
import { Stack } from 'expo-router';
import Colors from '../../constants/Colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="target-weight" />
      <Stack.Screen name="personal-details" />
      <Stack.Screen name="activity-level" />
      <Stack.Screen name="set-goal" />
    </Stack>
  );
}
