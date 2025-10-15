import AsyncStorage from '@react-native-async-storage/async-storage';

export type Profile = {
  fullName: string;
  birthDate?: string;
  deathDate?: string;
  isDeceased?: boolean;
  bio?: string;
  location?: string;
  occupation?: string;
};

export type Privacy = {
  profileVisibility: 'everyone' | 'verified' | 'superior';
  messagePermission: 'all' | 'superior' | 'none';
  showBirthDate: boolean;
  showLocation: boolean;
};

export type NotificationPrefs = {
  newFamily: boolean;
  connectionRequests: boolean;
  messages: boolean;
  birthdays: boolean;
  milestones: boolean;
};

const KEY_PROFILE = '@bloodline_profile';
const KEY_PRIVACY = '@bloodline_privacy';
const KEY_NOTIFS = '@bloodline_notification_prefs';

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function getProfile(): Promise<Profile> {
  return readJSON<Profile>(KEY_PROFILE, { fullName: '' });
}

export async function saveProfile(p: Profile): Promise<void> {
  await writeJSON(KEY_PROFILE, p);
}

export async function getPrivacy(): Promise<Privacy> {
  return readJSON<Privacy>(KEY_PRIVACY, {
    profileVisibility: 'everyone',
    messagePermission: 'all',
    showBirthDate: true,
    showLocation: true,
  });
}

export async function savePrivacy(p: Privacy): Promise<void> {
  await writeJSON(KEY_PRIVACY, p);
}

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  return readJSON<NotificationPrefs>(KEY_NOTIFS, {
    newFamily: true,
    connectionRequests: true,
    messages: true,
    birthdays: true,
    milestones: true,
  });
}

export async function saveNotificationPrefs(n: NotificationPrefs): Promise<void> {
  await writeJSON(KEY_NOTIFS, n);
}
