import * as Linking from 'expo-linking';

export function generateInvitationCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function buildInviteLink(code: string) {
  return Linking.createURL('/invite', { queryParams: { code } });
}
