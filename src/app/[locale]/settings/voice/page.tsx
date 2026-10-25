import { redirect } from 'next/navigation';

interface VoiceSettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function VoiceSettingsPage({ params }: VoiceSettingsPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/settings/profile`);
}
