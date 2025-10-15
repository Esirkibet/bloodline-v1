import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Redirect, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useEffect, useState } from 'react';
import { hasSeenOnboarding } from '@/utils/onboardingStorage';
import { useAuth } from '@/utils/useAuth';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [checking, setChecking] = useState(true);
  const [seen, setSeen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, loading: authLoading, profile } = useAuth();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const v = await hasSeenOnboarding();
      if (mounted) {
        setSeen(v);
        setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking || authLoading) return null;

  // Redirect to phone auth if not authenticated
  if (!isAuthenticated && pathname !== '/phone-auth') {
    return (
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Redirect href="/phone-auth" />
      </ThemeProvider>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {!seen && pathname !== '/onboarding' ? <Redirect href="/onboarding" /> : null}
        <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="phone-auth" options={{ headerShown: false }} />
        <Stack.Screen name="sign-in" options={{ title: 'Sign In' }} />
        <Stack.Screen name="auth-callback" options={{ headerShown: false }} />
        <Stack.Screen name="add-family" options={{ title: 'Add Family Member' }} />
        <Stack.Screen name="tree" options={{ title: 'Family Tree' }} />
        <Stack.Screen name="profile/[id]" options={{ title: 'Profile' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
