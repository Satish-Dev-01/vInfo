import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { UserDetailsRequest } from '@/types';

function resolveBackendUrl(): string {
  let url = process.env.USER_ME_DETAILS_URL || '';
  if (url.includes('${BASE_URL}')) {
    const base = process.env.BASE_URL || 'http://192.168.18.31:8085/';
    url = url.replace('${BASE_URL}', base);
  }
  if (!url) {
    url = process.env.BASE_URL
      ? `${process.env.BASE_URL.replace(/\/+$/, '')}/api/users/me/details`
      : 'http://192.168.18.31:8085/api/users/me/details';
  }
  return url;
}

function getAuthHeader(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (
    authHeader &&
    authHeader.trim() !== '' &&
    authHeader !== 'Bearer' &&
    authHeader !== 'Bearer null' &&
    authHeader !== 'Bearer undefined'
  ) {
    return authHeader;
  }

  const cookieToken =
    request.cookies.get('accessToken')?.value ||
    request.cookies.get('auth_token')?.value ||
    request.cookies.get('access_token')?.value ||
    request.cookies.get('token')?.value;
  if (
    cookieToken &&
    cookieToken.trim() !== '' &&
    cookieToken !== 'null' &&
    cookieToken !== 'undefined'
  ) {
    return `Bearer ${cookieToken.trim()}`;
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const headers: Record<string, string> = {
      accept: '*/*',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    const backendUrl = resolveBackendUrl();
    const backendRes = await fetch(backendUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(10000),
    });

    const text = await backendRes.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { raw: text } : null;
    }

    if (!backendRes.ok) {
      logger.warn(`Failed to retrieve user details (${backendRes.status})`, 'UserDetailsAPI', data);
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'User details not found or not initialized',
        },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error in GET user details', 'UserDetailsAPI', error);
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: 'Unable to connect to user details service',
      },
      { status: 503 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = getAuthHeader(request);
    const completeParam = request.nextUrl.searchParams.get('complete') ?? 'false';
    const contentType = request.headers.get('content-type') || '';

    let formDetailsObj: UserDetailsRequest = {
      phone: '',
      jobTitle: '',
      designation: '',
      country: 'India',
      highestQualification: 'M.Pharm',
      yearsOfExperience: 0,
      functions: [],
      productTypes: [],
    };

    let photoFile: File | Blob | null = null;

    if (contentType.includes('multipart/form-data')) {
      const incomingFormData = await request.formData();

      // Check formDetails JSON in form data or query
      const formDetailsField = incomingFormData.get('formDetails');
      const queryFormDetails = request.nextUrl.searchParams.get('formDetails');

      if (typeof formDetailsField === 'string' && formDetailsField.trim().startsWith('{')) {
        try {
          formDetailsObj = JSON.parse(formDetailsField);
        } catch {
          // ignore error
        }
      } else if (queryFormDetails && queryFormDetails.trim().startsWith('{')) {
        try {
          formDetailsObj = JSON.parse(queryFormDetails);
        } catch {
          // ignore error
        }
      } else {
        // Parse individual fields from form data if passed separately
        formDetailsObj = {
          phone: (incomingFormData.get('phone') as string) || '',
          jobTitle: (incomingFormData.get('jobTitle') as string) || '',
          designation: (incomingFormData.get('designation') as string) || '',
          country: (incomingFormData.get('country') as string) || 'India',
          highestQualification: (incomingFormData.get('highestQualification') as string) || 'M.Pharm',
          yearsOfExperience: parseInt((incomingFormData.get('yearsOfExperience') as string) || '0', 10) || 0,
          functions: incomingFormData.getAll('functions').map(String),
          productTypes: incomingFormData.getAll('productTypes').map(String),
        };
      }

      const photoEntry = incomingFormData.get('photo');
      if (photoEntry && photoEntry instanceof Blob) {
        photoFile = photoEntry;
      }
    } else {
      // Default to JSON body
      try {
        const body = await request.json();
        if (body && typeof body === 'object') {
          formDetailsObj = body as UserDetailsRequest;
        }
      } catch {
        // Fallback to query param formDetails
        const queryFormDetails = request.nextUrl.searchParams.get('formDetails');
        if (queryFormDetails && queryFormDetails.trim().startsWith('{')) {
          try {
            formDetailsObj = JSON.parse(queryFormDetails);
          } catch {
            // ignore
          }
        }
      }
    }

    // Build target backend URL
    const backendBaseUrl = resolveBackendUrl();
    const targetUrl = new URL(backendBaseUrl);

    // 1. Pass complete parameter
    targetUrl.searchParams.set('complete', completeParam);

    // 2. Pass formDetails object as JSON in query (as specified in Swagger OpenAPI parameters)
    const formDetailsJson = JSON.stringify(formDetailsObj);
    targetUrl.searchParams.set('formDetails', formDetailsJson);

    // 3. Also pass exploded query parameters for backends that bind @ParameterObject / @ModelAttribute
    if (formDetailsObj.phone) targetUrl.searchParams.set('phone', String(formDetailsObj.phone));
    if (formDetailsObj.jobTitle) targetUrl.searchParams.set('jobTitle', String(formDetailsObj.jobTitle));
    if (formDetailsObj.designation) targetUrl.searchParams.set('designation', String(formDetailsObj.designation));
    if (formDetailsObj.country) targetUrl.searchParams.set('country', String(formDetailsObj.country));
    if (formDetailsObj.highestQualification) targetUrl.searchParams.set('highestQualification', String(formDetailsObj.highestQualification));
    if (typeof formDetailsObj.yearsOfExperience !== 'undefined') {
      targetUrl.searchParams.set('yearsOfExperience', String(formDetailsObj.yearsOfExperience));
    }
    if (Array.isArray(formDetailsObj.functions)) {
      formDetailsObj.functions.forEach((fn) => targetUrl.searchParams.append('functions', fn));
    }
    if (Array.isArray(formDetailsObj.productTypes)) {
      formDetailsObj.productTypes.forEach((pt) => targetUrl.searchParams.append('productTypes', pt));
    }

    // Prepare Multipart Form Data for the Backend (photo)
    const backendFormData = new FormData();

    if (photoFile && photoFile.size > 0) {
      const fileName = (photoFile as File).name || 'photo.jpg';
      backendFormData.append('photo', photoFile, fileName);
    } else {
      // Swagger "[x] Send empty value"
      backendFormData.append('photo', new Blob([], { type: 'application/octet-stream' }), '');
    }

    // Also include formDetails in body if the backend expects it as a part
    backendFormData.append('formDetails', formDetailsJson);

    const headers: Record<string, string> = {
      accept: '*/*',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    logger.info(`Sending PUT user details to ${targetUrl.toString()}`, 'UserDetailsAPI');

    let backendRes = await fetch(targetUrl.toString(), {
      method: 'PUT',
      headers,
      body: backendFormData,
      signal: AbortSignal.timeout(20000),
    });

    // If backend returns 415 (Unsupported Media Type), fallback to application/json
    if (backendRes.status === 415) {
      logger.info('Backend returned 415 for multipart, retrying with application/json', 'UserDetailsAPI');
      const jsonHeaders: Record<string, string> = {
        accept: '*/*',
        'Content-Type': 'application/json',
      };
      if (authHeader) {
        jsonHeaders['Authorization'] = authHeader;
      }
      backendRes = await fetch(targetUrl.toString(), {
        method: 'PUT',
        headers: jsonHeaders,
        body: formDetailsJson,
        signal: AbortSignal.timeout(15000),
      });
    }

    // If backend returns 400 with empty blobs, try sending only non-empty files
    if (backendRes.status === 400 && (!photoFile || photoFile.size === 0)) {
      logger.info('Backend returned 400, attempting retry without empty file parts', 'UserDetailsAPI');
      const cleanFormData = new FormData();
      cleanFormData.append('formDetails', formDetailsJson);
      const retryRes = await fetch(targetUrl.toString(), {
        method: 'PUT',
        headers,
        body: cleanFormData,
        signal: AbortSignal.timeout(15000),
      });
      if (retryRes.ok) {
        backendRes = retryRes;
      }
    }

    const text = await backendRes.text();
    let data: unknown = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text ? { message: text } : null;
    }

    if (!backendRes.ok) {
      logger.warn(`Failed to update user details (${backendRes.status})`, 'UserDetailsAPI', data);
      const errObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
      return NextResponse.json(
        {
          success: false,
          message:
            (errObj.message as string) ||
            (errObj.error as string) ||
            'Failed to update user details',
          error: data,
        },
        { status: backendRes.status }
      );
    }

    const parsedObj = (data && typeof data === 'object') ? (data as Record<string, unknown>) : {};
    const backendNextStep =
      (parsedObj.nextStep as string) ||
      (parsedObj.data && typeof parsedObj.data === 'object'
        ? ((parsedObj.data as Record<string, unknown>).nextStep as string)
        : undefined);
    
    // When complete=true, advance past USER_DETAILS to backend's next step or default to DASHBOARD
    const resolvedNextStep =
      backendNextStep && backendNextStep !== 'USER_DETAILS'
        ? backendNextStep
        : 'DASHBOARD';

    const response = NextResponse.json({
      success: true,
      data,
      nextStep: resolvedNextStep,
      message: 'User details updated successfully',
    });

    response.cookies.set('next_step', resolvedNextStep, {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });
    response.cookies.set('onboarding_step_user_details_completed', 'true', {
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    logger.error('Error in PUT user details', 'UserDetailsAPI', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Unable to connect to user details service',
        code: 'SERVICE_UNAVAILABLE',
      },
      { status: 503 }
    );
  }
}

export { PUT as POST };
