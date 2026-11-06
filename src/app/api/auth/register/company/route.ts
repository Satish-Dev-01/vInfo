import { NextRequest, NextResponse } from 'next/server';
import { proxyRegisterRequest } from '@/lib/api/register-helper';
import { validatePassword } from '@/lib/validators/password';

const COMPANY_REGISTER_URL =
  process.env.AUTH_REGISTER_COMPANY_URL ||
  process.env.AUTH_REGISTER_BASE_URL ||
  'http://192.168.18.31:8085/api/auth/register';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firmType, companyName, country, fullName, email, password, confirmPassword } = body;

    if (!companyName || !email || !password || !confirmPassword || !fullName || !country) {
      return NextResponse.json(
        { success: false, message: 'Please fill in all required company registration fields' },
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
      accountType: 'COMPANY',
      firmType: firmType || 'MANUFACTURING',
      companyName: String(companyName).trim(),
      country: String(country).trim(),
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      password,
      confirmPassword,
    };

    return await proxyRegisterRequest({
      targetUrl: COMPANY_REGISTER_URL,
      body: payload,
      contextName: 'RegisterCompanyAPI',
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid registration request format' },
      { status: 400 }
    );
  }
}
