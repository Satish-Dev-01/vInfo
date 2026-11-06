import { NextRequest, NextResponse } from 'next/server';
import { proxyRegisterRequest } from '@/lib/api/register-helper';
import { validatePassword } from '@/lib/validators/password';

const EMPLOYEE_REGISTER_URL =
  process.env.AUTH_REGISTER_EMPLOYEE_URL ||
  process.env.AUTH_REGISTER_BASE_URL ||
  'http://192.168.18.31:8085/api/auth/register';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inviteCode, email, fullName, country, password, confirmPassword } = body;

    if (!inviteCode || !email || !password || !confirmPassword || !fullName || !country) {
      return NextResponse.json(
        { success: false, message: 'Please provide invite code, email, name, country, and password' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.message },
        { status: 400 }
      );
    }

    const payload = {
      accountType: 'EMPLOYEE',
      inviteCode: String(inviteCode).trim(),
      email: String(email).trim().toLowerCase(),
      fullName: String(fullName).trim(),
      country: String(country).trim(),
      password,
      confirmPassword,
    };

    return await proxyRegisterRequest({
      targetUrl: EMPLOYEE_REGISTER_URL,
      body: payload,
      contextName: 'RegisterEmployeeAPI',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid registration request format' },
      { status: 400 }
    );
  }
}
