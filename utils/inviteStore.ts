import AsyncStorage from '@react-native-async-storage/async-storage';

export type SentInvite = {
  code: string;
  fullName: string;
  relationship: string;
  inviteeEmail?: string;
  createdAt: string;
};

export type RelationshipQueueItem = {
  type: 'accept_by_code';
  code: string;
  queuedAt: string;
};

const SENT_KEY = '@bloodline_sent_invites';
const QUEUE_KEY = '@bloodline_relationship_queue';

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

export async function saveSentInvite(invite: SentInvite): Promise<void> {
  const list = await readJSON<SentInvite[]>(SENT_KEY, []);
  list.unshift(invite);
  await writeJSON(SENT_KEY, list);
}

export async function getSentInviteByCode(code: string): Promise<SentInvite | null> {
  const list = await readJSON<SentInvite[]>(SENT_KEY, []);
  return list.find((i) => i.code === code) ?? null;
}

export async function listSentInvites(): Promise<SentInvite[]> {
  return readJSON<SentInvite[]>(SENT_KEY, []);
}

export async function removeSentInvite(code: string): Promise<void> {
  const list = await readJSON<SentInvite[]>(SENT_KEY, []);
  const next = list.filter((i) => i.code !== code);
  await writeJSON(SENT_KEY, next);
}

export async function clearSentInvites(): Promise<void> {
  await writeJSON(SENT_KEY, []);
}

export async function enqueueRelationshipByCode(code: string): Promise<void> {
  const list = await readJSON<RelationshipQueueItem[]>(QUEUE_KEY, []);
  list.unshift({ type: 'accept_by_code', code, queuedAt: new Date().toISOString() });
  await writeJSON(QUEUE_KEY, list);
}

export async function getRelationshipQueue(): Promise<RelationshipQueueItem[]> {
  return readJSON<RelationshipQueueItem[]>(QUEUE_KEY, []);
}
