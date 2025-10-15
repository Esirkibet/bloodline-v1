import { useState, useEffect } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabaseClient';
import { useRouter } from 'expo-router';

const LAST_PHONE_KEY = '@bloodline_last_phone';

export default function PhoneAuthScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('+254');
  const [otp, setOtp] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const lastPhone = await AsyncStorage.getItem(LAST_PHONE_KEY);
      if (lastPhone) setPhone(lastPhone);
    })();
  }, []);

  async function sendOTP() {
    if (phone.length < 10) {
      Alert.alert('Invalid phone', 'Please enter a valid phone number.');
      return;
    }
    setBusy(true);
    try {
      await AsyncStorage.setItem(LAST_PHONE_KEY, phone);
      
      // Generate mock 6-digit code for testing (since SMS costs money)
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store the mock code for verification
      await AsyncStorage.setItem('@bloodline_mock_otp', mockCode);
      
      // Auto-fill the OTP for testing
      setTimeout(() => {
        setOtp(mockCode);
        Alert.alert(
          'Test Mode - OTP Code', 
          `Your verification code is: ${mockCode}\n\n(This code has been auto-filled for testing)`,
          [{ text: 'OK' }]
        );
      }, 500);
      
      setStep('otp');
    } catch (e: any) {
      Alert.alert('Failed to generate code', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  async function verifyOTP() {
    if (otp.length !== 6) {
      Alert.alert('Invalid code', 'Please enter the 6-digit code.');
      return;
    }
    setBusy(true);
    try {
      // Mock verification for testing
      const storedCode = await AsyncStorage.getItem('@bloodline_mock_otp');
      
      if (otp !== storedCode) {
        throw new Error('Invalid verification code');
      }
      
      // Create mock session for testing
      const mockUserId = `mock_${Date.now()}`;
      await AsyncStorage.setItem('@bloodline_mock_user_id', mockUserId);
      await AsyncStorage.setItem('@bloodline_mock_phone', phone);
      
      // Check if returning user (mock)
      const existingProfile = await AsyncStorage.getItem(`@bloodline_profile_${phone}`);
      
      if (existingProfile) {
        // Existing user, go to home
        router.replace('/');
      } else {
        // New user, need to complete profile
        setStep('profile');
      }
    } catch (e: any) {
      Alert.alert('Verification failed', e?.message ?? 'Invalid code');
    } finally {
      setBusy(false);
    }
  }

  async function completeProfile() {
    if (!fullName.trim()) {
      Alert.alert('Name required', 'Please enter your full name.');
      return;
    }
    setBusy(true);
    try {
      // Mock profile save for testing
      const mockProfile = {
        full_name: fullName.trim(),
        phone,
        created_at: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(`@bloodline_profile_${phone}`, JSON.stringify(mockProfile));
      await AsyncStorage.setItem('@bloodline_current_profile', JSON.stringify(mockProfile));
      
      router.replace('/onboarding');
    } catch (e: any) {
      Alert.alert('Failed to save profile', e?.message ?? 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {step === 'phone' && (
          <>
            <ThemedText type="title">Welcome to Bloodline</ThemedText>
            <ThemedText style={styles.subtitle}>Discover Your Roots, Connect Your Branches</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText>Enter your phone number</ThemedText>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+254712345678"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                autoComplete="tel"
                style={styles.input}
              />
              <ThemedText style={styles.hint}>Include country code (e.g., +254 for Kenya)</ThemedText>
            </View>

            <Pressable 
              onPress={sendOTP} 
              disabled={busy} 
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
            >
              <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>
                {busy ? 'Sending...' : 'Get Started'}
              </ThemedText>
            </Pressable>
          </>
        )}

        {step === 'otp' && (
          <>
            <ThemedText type="title">Verify Your Number</ThemedText>
            <ThemedText style={styles.subtitle}>Enter the 6-digit code sent to {phone}</ThemedText>
            
            <View style={styles.inputGroup}>
              <TextInput
                value={otp}
                onChangeText={setOtp}
                placeholder="000000"
                placeholderTextColor="#999"
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, styles.otpInput]}
              />
            </View>

            <Pressable 
              onPress={verifyOTP} 
              disabled={busy} 
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
            >
              <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>
                {busy ? 'Verifying...' : 'Verify Code'}
              </ThemedText>
            </Pressable>

            <Pressable onPress={() => setStep('phone')} style={styles.linkBtn}>
              <ThemedText style={styles.linkText}>Change phone number</ThemedText>
            </Pressable>
          </>
        )}

        {step === 'profile' && (
          <>
            <ThemedText type="title">Complete Your Profile</ThemedText>
            <ThemedText style={styles.subtitle}>Let your family know who you are</ThemedText>
            
            <View style={styles.inputGroup}>
              <ThemedText>Your full name</ThemedText>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="John Kamau"
                placeholderTextColor="#999"
                autoComplete="name"
                autoCapitalize="words"
                style={styles.input}
              />
            </View>

            <Pressable 
              onPress={completeProfile} 
              disabled={busy} 
              style={[styles.primaryBtn, busy && styles.btnDisabled]}
            >
              <ThemedText type="defaultSemiBold" style={styles.primaryBtnText}>
                {busy ? 'Saving...' : 'Start Building My Tree'}
              </ThemedText>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 32,
    color: '#666',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 24,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 12, 
    padding: 16,
    fontSize: 16,
    marginTop: 8,
  },
  otpInput: {
    fontSize: 24,
    textAlign: 'center',
    letterSpacing: 8,
  },
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  primaryBtn: { 
    backgroundColor: '#8B0000', 
    paddingVertical: 16, 
    borderRadius: 12, 
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: { 
    color: '#fff',
    fontSize: 16,
  },
  linkBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#8B0000',
    textDecorationLine: 'underline',
  },
});
