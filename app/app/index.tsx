/**
 * Index — Entry point router
 * Redirects based on onboarding state
 */
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import Colors from '../constants/Colors';

export default function Index() {
  const { onboardingDone, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!onboardingDone) {
    return <Redirect href="/(onboarding)/target-weight" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
