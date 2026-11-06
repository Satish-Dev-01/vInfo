import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function RootPage() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('accessToken')?.value ||
    cookieStore.get('auth_token')?.value ||
    cookieStore.get('access_token')?.value ||
    cookieStore.get('token')?.value;
  const nextStep = cookieStore.get('next_step')?.value;

  if (token && nextStep === 'ORG_BILLING_DETAILS') {
    redirect('/onboarding');
  }

  if (token && nextStep === 'DEPARTMENTS_AND_LEVELS') {
    redirect('/onboarding/departments');
  }

  if (token && nextStep === 'USER_DETAILS') {
    redirect('/onboarding/user-details');
  }

  if (token && nextStep === 'INVITE_TEAM') {
    redirect('/onboarding/invite');
  }

  if (token && (nextStep === 'DASHBOARD' || nextStep === 'COMPLETED' || !nextStep)) {
    redirect('/dashboard');
  }

  if (token) {
    redirect('/dashboard');
  }

  redirect('/login');
}
