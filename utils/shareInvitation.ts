import { Share } from 'react-native';

type SharePayload = {
  message: string;
  url?: string;
  subject?: string;
};

export async function shareInvitation(payload: SharePayload) {
  const result = await Share.share({
    message: payload.message,
    url: payload.url,
    title: payload.subject,
  });
  return result;
}
