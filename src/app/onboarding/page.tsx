'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Check,
  Info,
  ArrowRight,
  AlertCircle,
  FlaskConical,
  ChevronDown,
  Loader2,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/stores/app.store';
import { handleUnauthorizedSession, getStoredAuthToken } from '@/lib/auth-helpers';

interface FacilityItem {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  country: string;
  state: string;
  gstin: string;
}

interface CmoItem {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  country: string;
  state: string;
  gstin: string;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

const COUNTRIES = [
  'India',
  'Bangladesh',
  'United States',
  'United Kingdom',
  'Germany',
  'Switzerland',
  'Singapore',
  'Japan',
  'Vietnam',
  'United Arab Emirates',
];

const GST_STATE_CODE_MAP: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

interface CountryApiItem {
  country: string;
  cities?: string[];
}

interface StateApiItem {
  name: string;
  state_code?: string;
}

const getCountries = async (): Promise<CountryApiItem[]> => {
  try {
    const response = await fetch(
      "https://countriesnow.space/api/v0.1/countries"
    );

    if (!response.ok) {
      throw new Error("Failed to fetch countries");
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(result.msg || "API error");
    }

    return result.data;
  } catch (error) {
    console.error(error);
    return [];
  }
};

const getStates = async (country: string): Promise<StateApiItem[]> => {
  const response = await fetch(
    "https://countriesnow.space/api/v0.1/countries/states",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ country }),
    }
  );

  const result = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.msg || "Failed to fetch states");
  }

  return result.data.states;
};

export default function OnboardingOrganisationPage() {
  const router = useRouter();
  const addNotification = useAppStore((state) => state.addNotification);

  // Dynamic Countries & States from API
  const [countriesList, setCountriesList] = useState<string[]>(COUNTRIES);
  const [, setIsLoadingCountries] = useState(false);
  const statesCacheRef = useRef<Record<string, string[]>>({
    India: INDIAN_STATES,
  });
  const [statesCache, setStatesCache] = useState<Record<string, string[]>>({
    India: INDIAN_STATES,
  });
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const fetchStates = useCallback(async (targetCountry: string) => {
    const trimmed = targetCountry?.trim();
    if (!trimmed) return [];
    if (statesCacheRef.current[trimmed] && statesCacheRef.current[trimmed].length > 0) {
      return statesCacheRef.current[trimmed];
    }
    if (trimmed.toLowerCase() === 'india') {
      statesCacheRef.current[trimmed] = INDIAN_STATES;
      setStatesCache((prev) => ({ ...prev, [trimmed]: INDIAN_STATES }));
      return INDIAN_STATES;
    }

    setLoadingStates((prev) => ({ ...prev, [trimmed]: true }));
    try {
      const states = await getStates(trimmed);
      const stateNames = (states || []).map((s) => s.name).filter(Boolean);
      statesCacheRef.current[trimmed] = stateNames;
      setStatesCache((prev) => ({ ...prev, [trimmed]: stateNames }));
      return stateNames;
    } catch (err) {
      console.error(`Failed to fetch states for ${trimmed}:`, err);
      statesCacheRef.current[trimmed] = [];
      setStatesCache((prev) => ({ ...prev, [trimmed]: [] }));
      return [];
    } finally {
      setLoadingStates((prev) => ({ ...prev, [trimmed]: false }));
    }
  }, []);

  // Head Office State
  const [companyName, setCompanyName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [country, setCountry] = useState('India');
  const [state, setState] = useState('');
  const [gstin, setGstin] = useState('');

  // Facilities State
  const [hasFacilities, setHasFacilities] = useState<boolean>(false);
  const [facilities, setFacilities] = useState<FacilityItem[]>([]);

  // CMOs State
  const [hasCmos, setHasCmos] = useState<boolean>(false);
  const [cmos, setCmos] = useState<CmoItem[]>([]);

  // User profile & Step completion
  const [userInitials, setUserInitials] = useState('U');
  const [isStep1Completed, setIsStep1Completed] = useState(false);

  // UI status states
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState('Autosaved as you type');

  // Load user avatar initials and pre-fetch saved organisation/billing details from backend
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        if (typeof window !== 'undefined') {
          const token = getStoredAuthToken();
          if (!token) {
            handleUnauthorizedSession({
              router,
              redirectUrl: '/login?redirect=/onboarding',
              message: 'You must be logged in with a valid access token to access organisation setup.',
            });
            return;
          }

          const storedNextStep = localStorage.getItem('nextStep');
          const completed =
            localStorage.getItem('onboarding_step_1_completed') === 'true' ||
            storedNextStep === 'DEPARTMENTS_AND_LEVELS' ||
            storedNextStep === 'USER_DETAILS' ||
            storedNextStep === 'INVITE_TEAM' ||
            storedNextStep === 'DASHBOARD' ||
            storedNextStep === 'COMPLETED';

          setIsStep1Completed(completed);

          // If step 1 is already completed, do not allow user to return here; forward them
          if (completed) {
            if (storedNextStep === 'DASHBOARD' || storedNextStep === 'COMPLETED') {
              router.replace('/dashboard');
              return;
            }
            if (storedNextStep === 'INVITE_TEAM') {
              router.replace('/onboarding/invite');
              return;
            }
            if (storedNextStep === 'USER_DETAILS') {
              router.replace('/onboarding/user-details');
              return;
            }
            router.replace('/onboarding/departments');
            return;
          }
        }

        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
        if (userStr && isMounted) {
          const u = JSON.parse(userStr);
          const nameOrEmail = u.fullName || u.name || u.email || '';
          if (nameOrEmail) {
            const parts = nameOrEmail.trim().split(/\s+/);
            const inits =
              parts.length >= 2
                ? `${parts[0][0]}${parts[1][0]}`
                : parts[0].slice(0, 2);
            setUserInitials(inits.toUpperCase());
          }

          // Pre-fill company name from login session / user profile
          const orgFromLogin = (
            u.organizationName ||
            u.companyName ||
            u.orgName ||
            u.company ||
            u.organization?.name ||
            (typeof window !== 'undefined' ? localStorage.getItem('organizationName') : null) ||
            (typeof window !== 'undefined' ? localStorage.getItem('companyName') : null) ||
            ''
          ).trim();

          if (orgFromLogin) {
            setCompanyName(orgFromLogin);
          } else {
            // Default company name if none provided in session
            setCompanyName('Sunrise Pharma Pvt. Ltd.');
          }
        } else if (isMounted) {
          const fallbackOrg =
            (typeof window !== 'undefined' && (localStorage.getItem('organizationName') || localStorage.getItem('companyName'))) ||
            'Sunrise Pharma Pvt. Ltd.';
          setCompanyName(fallbackOrg);
        }

        // Fetch existing saved organisation/billing details from backend
        const token = getStoredAuthToken();
        const res = await fetch('/api/org/billing-details', {
          method: 'GET',
          headers: {
            'accept': '*/*',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (res.status === 401) {
          handleUnauthorizedSession({ router });
          return;
        }

        if (res.ok && isMounted) {
          const resData = await res.json();
          const details = resData?.data || resData;
          if (details?.headOffice) {
            const ho = details.headOffice;
            if (ho.companyName) setCompanyName(ho.companyName);
            if (ho.addressLine1) setAddress1(ho.addressLine1);
            if (ho.addressLine2) setAddress2(ho.addressLine2);
            if (ho.city) setCity(ho.city);
            if (ho.pinCode) setPinCode(ho.pinCode);
            if (ho.country) {
              setCountry(ho.country);
              fetchStates(ho.country);
            }
            if (ho.state) setState(ho.state);
            if (ho.gstin) setGstin(ho.gstin);
          }

          if (typeof details?.ownsManufacturingFacilities === 'boolean') {
            setHasFacilities(details.ownsManufacturingFacilities);
          }
          if (Array.isArray(details?.manufacturingFacilities) && details.manufacturingFacilities.length > 0) {
            setFacilities(
              details.manufacturingFacilities.map((fac: Record<string, unknown>, idx: number) => {
                const facCountry = (fac.country as string) || 'India';
                fetchStates(facCountry);
                return {
                  id: (fac.id as string) || `fac-${idx + 1}`,
                  name: (fac.name as string) || '',
                  addressLine1: (fac.addressLine1 as string) || '',
                  addressLine2: (fac.addressLine2 as string) || '',
                  city: (fac.city as string) || '',
                  pincode: (fac.pinCode as string) || (fac.pincode as string) || '',
                  country: facCountry,
                  state: (fac.state as string) || '',
                  gstin: (fac.gstin as string) || '',
                };
              })
            );
          }

          if (typeof details?.hasThirdPartyManufacturers === 'boolean') {
            setHasCmos(details.hasThirdPartyManufacturers);
          }
          if (Array.isArray(details?.thirdPartyManufacturers) && details.thirdPartyManufacturers.length > 0) {
            setCmos(
              details.thirdPartyManufacturers.map((cmo: Record<string, unknown>, idx: number) => {
                const cmoCountry = (cmo.country as string) || 'India';
                fetchStates(cmoCountry);
                return {
                  id: (cmo.id as string) || `cmo-${idx + 1}`,
                  name: (cmo.name as string) || '',
                  addressLine1: (cmo.addressLine1 as string) || '',
                  addressLine2: (cmo.addressLine2 as string) || '',
                  city: (cmo.city as string) || '',
                  pincode: (cmo.pinCode as string) || (cmo.pincode as string) || '',
                  country: cmoCountry,
                  state: (cmo.state as string) || '',
                  gstin: (cmo.gstin as string) || '',
                };
              })
            );
          }
        }
      } catch {
        // ignore initial prefetch errors
      }
    };

    initData();
    return () => {
      isMounted = false;
    };
  }, [router, fetchStates]);

  // Load country list dynamically on mount using CountriesNow API
  useEffect(() => {
    let isMounted = true;
    const loadCountries = async () => {
      setIsLoadingCountries(true);
      try {
        const data = await getCountries();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const names = data
            .map((item) => (typeof item === 'string' ? item : item.country))
            .filter(Boolean) as string[];
          const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
          setCountriesList(unique);
        }
      } catch (err) {
        console.error('Failed to load countries list:', err);
      } finally {
        if (isMounted) setIsLoadingCountries(false);
      }
    };

    loadCountries();
    return () => {
      isMounted = false;
    };
  }, []);

  // Indian entity & GSTIN Validation helpers
  const isIndia = (country || 'India').trim().toLowerCase() === 'india';
  const isGstinLengthValid = gstin.trim().length === 15;
  const isGstinFormatValid = GSTIN_REGEX.test(gstin.trim());
  const isGstinValid = isIndia
    ? (!gstin.trim() || (isGstinLengthValid && isGstinFormatValid))
    : true;
  const isPincodeValid = isIndia
    ? (pinCode.trim().length === 6 && /^\d+$/.test(pinCode.trim()))
    : Boolean(pinCode.trim());

  // Form validity check: required fields must be filled
  const isFormValid = Boolean(
    companyName.trim() &&
    address1.trim() &&
    city.trim() &&
    (isIndia ? (pinCode.trim().length === 6 && /^\d+$/.test(pinCode.trim())) : pinCode.trim()) &&
    country.trim() &&
    state.trim() &&
    (!isIndia || !gstin.trim() || (gstin.trim().length === 15 && GSTIN_REGEX.test(gstin.trim()))) &&
    (!hasFacilities ||
      (facilities.length > 0 &&
        facilities.every((f) => {
          const isFacIndia = (f.country || 'India').trim().toLowerCase() === 'india';
          const isFacGstinValid = !isFacIndia || !f.gstin.trim() || (f.gstin.trim().length === 15 && GSTIN_REGEX.test(f.gstin.trim()));
          return (
            f.name.trim() &&
            f.addressLine1.trim() &&
            f.city.trim() &&
            f.pincode.trim() &&
            isFacGstinValid
          );
        }))) &&
    (!hasCmos ||
      (cmos.length > 0 &&
        cmos.every((c) => {
          const isCmoIndia = (c.country || 'India').trim().toLowerCase() === 'india';
          const isCmoGstinValid = !isCmoIndia || !c.gstin.trim() || (c.gstin.trim().length === 15 && GSTIN_REGEX.test(c.gstin.trim()));
          return (
            c.name.trim() &&
            c.addressLine1.trim() &&
            c.city.trim() &&
            isCmoGstinValid
          );
        })))
  );

  // Live autosave visual indicator
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastSavedTime('Autosaved as you type');
    }, 1200);
    return () => clearTimeout(timer);
  }, [
    companyName,
    address1,
    address2,
    city,
    pinCode,
    country,
    state,
    gstin,
    facilities,
    cmos,
    hasFacilities,
    hasCmos,
  ]);

  // Format and handle GSTIN input changes with auto state detection
  const handleGstinChange = (value: string) => {
    const uppercaseVal = value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
    setGstin(uppercaseVal);

    if (uppercaseVal.length >= 2 && (!state || state.trim() === '')) {
      const stateCode = uppercaseVal.slice(0, 2);
      if (GST_STATE_CODE_MAP[stateCode]) {
        setState(GST_STATE_CODE_MAP[stateCode]);
      }
    }
  };

  // Facility handlers
  const handleToggleFacilities = (val: boolean) => {
    setHasFacilities(val);
    if (val && facilities.length === 0) {
      setFacilities([
        {
          id: `fac-${Date.now()}`,
          name: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          pincode: '',
          country: country || 'India',
          state: '',
          gstin: '',
        },
      ]);
    }
  };

  const handleAddFacility = () => {
    const newId = `fac-${Date.now()}`;
    const newFacility: FacilityItem = {
      id: newId,
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      country: country || 'India',
      state: '',
      gstin: '',
    };
    setFacilities([...facilities, newFacility]);
    addNotification({
      type: 'info',
      title: 'Facility Added',
      message: `Added Facility ${facilities.length + 1} to your setup.`,
    });
  };

  const handleRemoveFacility = (id: string) => {
    setFacilities(facilities.filter((f) => f.id !== id));
  };

  const handleUpdateFacility = (id: string, field: keyof FacilityItem, value: string) => {
    setFacilities(
      facilities.map((f) => {
        if (f.id !== id) return f;
        if (field === 'country') {
          const isNowIndia = value.trim().toLowerCase() === 'india';
          return { ...f, country: value, ...(isNowIndia ? {} : { gstin: '' }) };
        }
        if (field === 'gstin') {
          const clean = value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
          let updatedState = f.state;
          if (clean.length >= 2 && (!f.state || f.state.trim() === '')) {
            const stateCode = clean.slice(0, 2);
            if (GST_STATE_CODE_MAP[stateCode]) {
              updatedState = GST_STATE_CODE_MAP[stateCode];
            }
          }
          return { ...f, gstin: clean, state: updatedState };
        }
        return { ...f, [field]: value };
      })
    );
  };

  // CMO handlers
  const handleToggleCmos = (val: boolean) => {
    setHasCmos(val);
    if (val && cmos.length === 0) {
      setCmos([
        {
          id: `cmo-${Date.now()}`,
          name: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          pincode: '',
          country: country || 'India',
          state: '',
          gstin: '',
        },
      ]);
    }
  };

  const handleAddCmo = () => {
    const newId = `cmo-${Date.now()}`;
    const newCmo: CmoItem = {
      id: newId,
      name: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      country: country || 'India',
      state: '',
      gstin: '',
    };
    setCmos([...cmos, newCmo]);
    addNotification({
      type: 'info',
      title: 'Manufacturer Added',
      message: `Added Manufacturer ${cmos.length + 1} to your setup.`,
    });
  };

  const handleRemoveCmo = (id: string) => {
    setCmos(cmos.filter((c) => c.id !== id));
  };

  const handleUpdateCmo = (id: string, field: keyof CmoItem, value: string) => {
    setCmos(
      cmos.map((c) => {
        if (c.id !== id) return c;
        if (field === 'country') {
          const isNowIndia = value.trim().toLowerCase() === 'india';
          return { ...c, country: value, ...(isNowIndia ? {} : { gstin: '' }) };
        }
        if (field === 'gstin') {
          const clean = value.toUpperCase().replace(/[^0-9A-Z]/g, '').slice(0, 15);
          let updatedState = c.state;
          if (clean.length >= 2 && (!c.state || c.state.trim() === '')) {
            const stateCode = clean.slice(0, 2);
            if (GST_STATE_CODE_MAP[stateCode]) {
              updatedState = GST_STATE_CODE_MAP[stateCode];
            }
          }
          return { ...c, gstin: clean, state: updatedState };
        }
        return { ...c, [field]: value };
      })
    );
  };

  const isUUID = (str?: string) =>
    !!str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  // Save & Continue Action
  const handleSaveAndContinue = async () => {
    // Strict validation: cannot proceed unless onboarding is filled
    if (!companyName.trim()) {
      addNotification({
        type: 'warning',
        title: 'Company Name Required',
        message: 'Please enter your registered organisation / company name.',
      });
      return;
    }

    if (!address1.trim()) {
      addNotification({
        type: 'warning',
        title: 'Street Address Required',
        message: 'Please enter your Head Office street address.',
      });
      return;
    }

    if (!city.trim()) {
      addNotification({
        type: 'warning',
        title: 'City Required',
        message: 'Please enter the city for your Head Office.',
      });
      return;
    }

    if (!pinCode.trim() || pinCode.trim().length !== 6 || !/^\d+$/.test(pinCode.trim())) {
      addNotification({
        type: 'warning',
        title: 'Valid PIN Code Required',
        message: 'Please enter a valid 6-digit postal PIN code.',
      });
      return;
    }

    if (!country.trim()) {
      addNotification({
        type: 'warning',
        title: 'Country Required',
        message: 'Please select a country.',
      });
      return;
    }

    if (!state.trim()) {
      addNotification({
        type: 'warning',
        title: 'State Required',
        message: 'Please select or enter the state / union territory.',
      });
      return;
    }

    // GSTIN is optional for India; for other countries it is not shown or applicable
    if (isIndia && gstin.trim()) {
      if (!isGstinLengthValid) {
        addNotification({
          type: 'warning',
          title: 'Invalid GSTIN Length',
          message: `GSTIN must be exactly 15 characters (currently ${gstin.trim().length} characters).`,
        });
        return;
      }

      if (!isGstinFormatValid) {
        addNotification({
          type: 'warning',
          title: 'Invalid GSTIN Format',
          message: 'Please enter a valid 15-character GSTIN format (e.g. 27AAPFU0939F1ZV).',
        });
        return;
      }
    }

    if (hasFacilities) {
      if (facilities.length === 0) {
        addNotification({
          type: 'warning',
          title: 'Facility Details Required',
          message: 'You selected manufacturing facilities. Please add at least one facility or toggle to No.',
        });
        return;
      }
      const incompleteFac = facilities.find((f) => !f.name.trim() || !f.addressLine1.trim() || !f.city.trim());
      if (incompleteFac) {
        addNotification({
          type: 'warning',
          title: 'Incomplete Facility',
          message: 'Please fill in Name, Street Address, and City for all added manufacturing facilities.',
        });
        return;
      }

      for (const fac of facilities) {
        const facName = fac.name.trim() || 'Manufacturing facility';
        const isFacIndia = (fac.country || 'India').trim().toLowerCase() === 'india';

        if (isFacIndia && fac.gstin.trim()) {
          if (fac.gstin.trim().length !== 15) {
            addNotification({
              type: 'warning',
              title: 'Invalid Facility GSTIN Length',
              message: `GSTIN for "${facName}" must be exactly 15 characters (currently ${fac.gstin.trim().length} characters).`,
            });
            return;
          }

          if (!GSTIN_REGEX.test(fac.gstin.trim())) {
            addNotification({
              type: 'warning',
              title: 'Invalid Facility GSTIN Format',
              message: `Please enter a valid 15-character GSTIN format for "${facName}" (e.g. 27AAPFU0939F1ZV).`,
            });
            return;
          }
        }
      }
    }

    if (hasCmos) {
      if (cmos.length === 0) {
        addNotification({
          type: 'warning',
          title: 'Manufacturer Details Required',
          message: 'You selected contract manufacturers. Please add at least one manufacturer or toggle to No.',
        });
        return;
      }
      const incompleteCmo = cmos.find((c) => !c.name.trim() || !c.addressLine1.trim() || !c.city.trim());
      if (incompleteCmo) {
        addNotification({
          type: 'warning',
          title: 'Incomplete Manufacturer',
          message: 'Please fill in Name, Street Address, and City for all added contract manufacturers.',
        });
        return;
      }

      for (const cmo of cmos) {
        const cmoName = cmo.name.trim() || 'Third-party manufacturer';
        const isCmoIndia = (cmo.country || 'India').trim().toLowerCase() === 'india';

        if (isCmoIndia && cmo.gstin.trim()) {
          if (cmo.gstin.trim().length !== 15) {
            addNotification({
              type: 'warning',
              title: 'Invalid Manufacturer GSTIN Length',
              message: `GSTIN for "${cmoName}" must be exactly 15 characters (currently ${cmo.gstin.trim().length} characters).`,
            });
            return;
          }

          if (!GSTIN_REGEX.test(cmo.gstin.trim())) {
            addNotification({
              type: 'warning',
              title: 'Invalid Manufacturer GSTIN Format',
              message: `Please enter a valid 15-character GSTIN format for "${cmoName}" (e.g. 27AAPFU0939F1ZV).`,
            });
            return;
          }
        }
      }
    }

    setIsSaving(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const payload = {
      headOffice: {
        companyName: companyName.trim(),
        addressLine1: address1.trim(),
        addressLine2: address2.trim(),
        city: city.trim(),
        pinCode: pinCode.trim(),
        country: country.trim(),
        state: state.trim(),
        gstin: isIndia ? gstin.trim() : '',
      },
      ownsManufacturingFacilities: hasFacilities,
      manufacturingFacilities: hasFacilities
        ? facilities.map((fac) => {
          const isFacIndia = (fac.country || 'India').trim().toLowerCase() === 'india';
          return {
            ...(isUUID(fac.id) ? { id: fac.id } : {}),
            name: fac.name.trim(),
            addressLine1: fac.addressLine1.trim(),
            addressLine2: fac.addressLine2.trim(),
            city: fac.city.trim(),
            pinCode: fac.pincode.trim(),
            country: fac.country.trim(),
            state: fac.state.trim(),
            gstin: isFacIndia ? fac.gstin.trim() : '',
          };
        })
        : [],
      hasThirdPartyManufacturers: hasCmos,
      thirdPartyManufacturers: hasCmos
        ? cmos.map((cmo) => {
          const isCmoIndia = (cmo.country || 'India').trim().toLowerCase() === 'india';
          return {
            ...(isUUID(cmo.id) ? { id: cmo.id } : {}),
            name: cmo.name.trim(),
            addressLine1: cmo.addressLine1.trim(),
            addressLine2: cmo.addressLine2.trim(),
            city: cmo.city.trim(),
            pinCode: cmo.pincode.trim(),
            country: cmo.country.trim(),
            state: cmo.state.trim(),
            gstin: isCmoIndia ? cmo.gstin.trim() : '',
          };
        })
        : [],
    };

    try {
      const response = await fetch('/api/org/billing-details', {
        method: 'PUT',
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          ...(token && token !== 'null' && token !== 'undefined' ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success !== false) {
        const nextStep = data?.nextStep || data?.data?.nextStep || 'DEPARTMENTS_AND_LEVELS';
        if (typeof window !== 'undefined') {
          localStorage.setItem('onboarding_step_1_completed', 'true');
          localStorage.setItem('nextStep', nextStep);
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...u, organizationName: companyName.trim() }));
          } catch {
            // ignore
          }
        }
        if (typeof document !== 'undefined') {
          document.cookie = `next_step=${encodeURIComponent(nextStep)}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = 'onboarding_step_1_completed=true; path=/; max-age=604800; SameSite=Lax';
        }
        setIsStep1Completed(true);
        addNotification({
          type: 'success',
          title: 'Organisation Details Saved',
          message: data?.message || (nextStep === 'DASHBOARD' ? 'Setup completed! Proceeding to dashboard.' : 'Proceeding to Departments & levels setup.'),
        });

        if (nextStep === 'DASHBOARD' || nextStep === 'COMPLETED') {
          router.push('/dashboard');
        } else if (nextStep === 'USER_DETAILS') {
          router.push('/onboarding/user-details');
        } else if (nextStep === 'INVITE_TEAM') {
          router.push('/onboarding/invite');
        } else {
          router.push('/onboarding/departments');
        }
      } else {
        if (response.status === 401) {
          handleUnauthorizedSession({
            router,
            message: 'Your session has expired. Please log in again to save organisation details.',
          });
          return;
        }

        const errorMsg =
          data?.message ||
          data?.error?.message ||
          (typeof data?.error === 'string' ? data.error : null) ||
          'Failed to save organisation details. Please check the entered data.';

        addNotification({
          type: 'error',
          title: 'Save Failed',
          message: errorMsg,
        });
      }
    } catch {
      addNotification({
        type: 'error',
        title: 'Connection Error',
        message: 'Could not connect to the server to save your details. Please check your connection.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'next_step=DASHBOARD; path=/; max-age=604800; SameSite=Lax';
      document.cookie = 'onboarding_step_1_completed=true; path=/; max-age=604800; SameSite=Lax';
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_step_1_completed', 'true');
      localStorage.setItem('nextStep', 'DASHBOARD');
    }
    addNotification({
      type: 'info',
      title: 'Setup Skipped',
      message: 'You can complete your organisation profile anytime from Settings.',
    });
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EF] text-[#29251F] font-sans antialiased flex flex-col selection:bg-[#1F6E5B] selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          TOP NAVBAR WITH STEPPER
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EAE2D4] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_1px_2px_rgba(41,37,31,0.03)]">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2f8e75] to-[#1f6e5b] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <FlaskConical className="w-4 h-4 stroke-[2.3]" />
          </div>
          <span className="font-serif font-bold text-lg text-[#124a3d] tracking-tight">
            Vaayath
          </span>
        </Link>

        {/* Stepper (Center) */}
        <nav className="hidden md:flex items-center gap-3" aria-label="Onboarding Progress">
          {/* Step 1: Active */}
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#1F6E5B] text-white flex items-center justify-center text-xs font-bold ring-4 ring-[#E6EFE9]">
              1
            </span>
            <span className="text-xs font-bold text-[#1F6E5B]">
              Organisation &amp; billing
            </span>
          </div>

          <span className="w-10 h-0.5 bg-[#EAE2D4]" />

          {/* Step 2: Next */}
          {isStep1Completed ? (
            <Link href="/onboarding/departments" className="flex items-center gap-2 group cursor-pointer">
              <span className="w-6 h-6 rounded-full bg-[#F2ECE1] text-[#9A9184] group-hover:bg-[#E6EFE9] group-hover:text-[#1F6E5B] flex items-center justify-center text-xs font-bold transition-colors">
                2
              </span>
              <span className="text-xs font-medium text-[#726A5D] group-hover:text-[#1F6E5B] transition-colors">
                Departments &amp; levels
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 opacity-40 cursor-not-allowed select-none" title="Complete organisation details to unlock">
              <span className="w-6 h-6 rounded-full bg-[#F2ECE1] text-[#9A9184] flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span className="text-xs font-medium text-[#9A9184]">
                Departments &amp; levels
              </span>
            </div>
          )}

          <span className="w-10 h-0.5 bg-[#EAE2D4]" />

          {/* Step 3: Pending */}
          <div className="flex items-center gap-2 opacity-40 cursor-not-allowed select-none" title="Complete organisation & department setup to unlock">
            <span className="w-6 h-6 rounded-full bg-[#F2ECE1] text-[#9A9184] flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span className="text-xs font-medium text-[#9A9184]">
              Invite team
            </span>
          </div>
        </nav>

        {/* Top Right: Skip & User Initial Badge */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs font-semibold text-[#726A5D] hover:text-[#29251F] transition-colors cursor-pointer"
          >
            Skip setup
          </button>
          <div className="w-8 h-8 rounded-full bg-[#C98A3A] text-white flex items-center justify-center text-xs font-bold shadow-sm tracking-wide">
            {userInitials}
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CONTENT AREA
      ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 sm:px-8 py-8 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-8 items-start">

          {/* LEFT / CENTER COLUMN: FORM SECTIONS */}
          <div className="space-y-6">

            {/* Lead Title */}
            <div className="space-y-2">
              <span className="inline-block text-[11px] font-bold tracking-widest uppercase text-[#1F6E5B]">
                STEP 1 OF 3 • OPTIONAL
              </span>
              <h1 className="text-3xl sm:text-[34px] font-serif font-bold text-[#29251F] tracking-tight leading-tight">
                Organisation &amp; billing details
              </h1>
              <p className="text-sm sm:text-[14.5px] text-[#726A5D] leading-relaxed max-w-2xl">
                Used on invoices and documents, and to link your work to the right site. Skip anything you don&apos;t have handy.
              </p>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 1: HEAD OFFICE
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(41,37,31,0.04),0_10px_30px_rgba(41,37,31,0.04)] space-y-5">
              <div className="flex items-center gap-3 pb-1 border-b border-[#F2ECE1]">
                <div className="w-7 h-7 rounded-lg bg-[#E6EFE9] text-[#124A3D] flex items-center justify-center font-serif font-extrabold text-sm">
                  1
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-[#29251F]">
                    Head office
                  </h2>
                  <p className="text-xs text-[#9A9184]">
                    Your company&apos;s registered address.
                  </p>
                </div>
              </div>

              {/* Company Name (Prefilled from login, read-only) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-[#29251F]">
                    Company name
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#726A5D]">
                    <Lock className="w-3 h-3 text-[#9A9184]" />
                    <span>From your login account (read-only)</span>
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={companyName}
                    readOnly
                    tabIndex={-1}
                    placeholder="Organisation / Company name"
                    className="w-full rounded-xl border border-[#EAE2D4] bg-[#F5F1E9]/80 px-3.5 py-2.5 pr-10 text-sm text-[#29251F] font-semibold cursor-not-allowed select-text focus:outline-none shadow-2xs"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#9A9184]">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Address Line 1 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#29251F]">
                  Address line 1
                </label>
                <input
                  type="text"
                  value={address1}
                  onChange={(e) => setAddress1(e.target.value)}
                  placeholder="Enter street address / landmark"
                  className="w-full rounded-xl border border-[#EAE2D4] bg-[#FDFCF9] px-3.5 py-2.5 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                />
              </div>

              {/* Address Line 2 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#29251F]">
                  Address line 2
                </label>
                <input
                  type="text"
                  value={address2}
                  onChange={(e) => setAddress2(e.target.value)}
                  placeholder="Enter area / locality (optional)"
                  className="w-full rounded-xl border border-[#EAE2D4] bg-[#FDFCF9] px-3.5 py-2.5 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                />
              </div>

              {/* City & Pin code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#29251F]">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city"
                    className="w-full rounded-xl border border-[#EAE2D4] bg-[#FDFCF9] px-3.5 py-2.5 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#29251F]">
                    Pin/Zip code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="Enter 6-digit pin code"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono tracking-wider transition-all focus:outline-none ${pinCode && !isPincodeValid
                      ? 'border-red-400 bg-red-50/40 text-red-900 focus:ring-2 focus:ring-red-400/20'
                      : 'border-[#EAE2D4] bg-[#FDFCF9] text-[#29251F] focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B]'
                      }`}
                  />
                  {pinCode && !isPincodeValid && (
                    <p className="text-[11px] text-red-600 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" />
                      Pin code must be exactly 6 digits
                    </p>
                  )}
                </div>
              </div>

              {/* Country & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[#29251F]">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      value={country}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCountry(val);
                        setState('');
                        fetchStates(val);
                        if (val.trim().toLowerCase() !== 'india') {
                          setGstin('');
                        }
                      }}
                      className="w-full appearance-none rounded-xl border border-[#EAE2D4] bg-[#FDFCF9] px-3.5 py-2.5 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all pr-8 cursor-pointer"
                    >
                      <option value="">Select country</option>
                      {countriesList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#9A9184] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#29251F]">
                      State
                    </label>
                    {loadingStates[country] && (
                      <span className="text-[10.5px] text-[#726A5D] flex items-center gap-1 font-normal">
                        <Loader2 className="w-3 h-3 animate-spin text-[#1F6E5B]" />
                        <span>Loading states...</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    {statesCache[country] && statesCache[country].length > 0 ? (
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full appearance-none rounded-xl border border-[#EAE2D4] bg-[#FDFCF9] px-3.5 py-2.5 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all pr-8 cursor-pointer"
                      >
                        <option value="" disabled>
                          Select state
                        </option>
                        {statesCache[country].map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder={loadingStates[country] ? 'Loading states...' : 'State / Province / Region'}
                        className="w-full rounded-xl border border-[#EAE2D4] bg-[#FDFCF9] px-3.5 py-2.5 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                      />
                    )}
                    {statesCache[country] && statesCache[country].length > 0 && (
                      <ChevronDown className="w-4 h-4 text-[#9A9184] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
                </div>
              </div>

              {/* GSTIN (Only shown for India, and optional) */}
              {isIndia && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-[#29251F]">
                      GSTIN <span className="text-[11px] font-normal text-[#9A9184]">(Optional)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    placeholder="e.g. 27AAPFU0939F1ZV (Optional)"
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono tracking-wider transition-all focus:outline-none ${isGstinValid && gstin.trim()
                      ? 'border-[#3E9B5F] bg-[#FDFCF9] text-[#29251F] focus:ring-2 focus:ring-[#3E9B5F]/20'
                      : gstin.trim().length > 0 && (!isGstinLengthValid || !isGstinFormatValid)
                        ? 'border-amber-400 bg-amber-50/20 text-[#29251F] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                        : 'border-[#EAE2D4] bg-[#FDFCF9] text-[#29251F] focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B]'
                      }`}
                  />
                  <div className="flex items-center gap-1.5 text-[11.5px] text-[#9A9184] pt-0.5">
                    {isGstinValid && gstin.trim() ? (
                      <span className="text-[#3E9B5F] font-medium inline-flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Valid 15-character GSTIN
                      </span>
                    ) : gstin.trim().length > 0 && !isGstinLengthValid ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Must be exactly 15 characters ({gstin.trim().length}/15)
                      </span>
                    ) : gstin.trim().length === 15 && !isGstinFormatValid ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Invalid format: 2 digits state + 10-char PAN + 1 entity + Z + 1 checksum
                      </span>
                    ) : (
                      <span>15-character GST identification number for Indian operations (optional).</span>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 2: MANUFACTURING FACILITIES
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(41,37,31,0.04),0_10px_30px_rgba(41,37,31,0.04)] space-y-5">
              <div className="flex items-center gap-3 pb-1 border-b border-[#F2ECE1]">
                <div className="w-7 h-7 rounded-lg bg-[#E6EFE9] text-[#124A3D] flex items-center justify-center font-serif font-extrabold text-sm">
                  2
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-[#29251F]">
                    Manufacturing facilities
                  </h2>
                  <p className="text-xs text-[#9A9184]">
                    Sites your company owns. Vaayath tools use these to tag work to a specific site.
                  </p>
                </div>
              </div>

              {/* Yes/No Prompt */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#FBF9F4] rounded-xl border border-[#EAE2D4]/70">
                <span className="text-xs sm:text-sm font-semibold text-[#29251F]">
                  Do you own one or more manufacturing facilities?
                </span>
                <div className="inline-flex bg-[#F1ECE2] p-1 rounded-lg self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleToggleFacilities(true)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${hasFacilities
                      ? 'bg-white text-[#124A3D] shadow-sm'
                      : 'text-[#726A5D] hover:text-[#29251F]'
                      }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleFacilities(false)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${!hasFacilities
                      ? 'bg-white text-[#124A3D] shadow-sm'
                      : 'text-[#726A5D] hover:text-[#29251F]'
                      }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Facility Cards List */}
              {hasFacilities && (
                <div className="space-y-4 pt-1">
                  {facilities.map((fac, index) => (
                    <div
                      key={fac.id}
                      className="border border-[#EAE2D4] rounded-xl bg-[#FDFCF9] overflow-hidden transition-all duration-200 shadow-sm"
                    >
                      {/* Sub-Card Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#FBF9F4] border-b border-[#F2ECE1]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold text-[#124A3D] bg-[#E6EFE9] px-2.5 py-0.5 rounded-md font-serif">
                            Facility {index + 1}
                          </span>
                          <span className="text-xs font-bold text-[#29251F] truncate max-w-[220px] sm:max-w-xs">
                            {fac.name || 'Unnamed Unit'}
                          </span>
                        </div>
                        {facilities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFacility(fac.id)}
                            className="text-xs text-[#9A9184] hover:text-red-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* Sub-Card Body */}
                      <div className="p-4 sm:p-5 space-y-3.5">
                        {/* Facility Name */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-[#29251F]">
                            Facility name
                          </label>
                          <input
                            type="text"
                            value={fac.name}
                            onChange={(e) =>
                              handleUpdateFacility(fac.id, 'name', e.target.value)
                            }
                            placeholder="Enter facility name"
                            className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                          />
                        </div>

                        {/* Address 1 & 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              Address line 1
                            </label>
                            <input
                              type="text"
                              value={fac.addressLine1}
                              onChange={(e) =>
                                handleUpdateFacility(fac.id, 'addressLine1', e.target.value)
                              }
                              placeholder="Enter street address"
                              className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              Address line 2
                            </label>
                            <input
                              type="text"
                              value={fac.addressLine2}
                              onChange={(e) =>
                                handleUpdateFacility(fac.id, 'addressLine2', e.target.value)
                              }
                              placeholder="Enter area / locality (optional)"
                              className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          </div>
                        </div>

                        {/* City & Pin/Zip */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              City
                            </label>
                            <input
                              type="text"
                              value={fac.city}
                              onChange={(e) =>
                                handleUpdateFacility(fac.id, 'city', e.target.value)
                              }
                              placeholder="Enter city"
                              className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              Pin/Zip code
                            </label>
                            <input
                              type="text"
                              value={fac.pincode}
                              onChange={(e) =>
                                handleUpdateFacility(fac.id, 'pincode', e.target.value)
                              }
                              placeholder="Enter pin code"
                              className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm font-mono text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          </div>
                        </div>

                        {/* Country & State */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              Country
                            </label>
                            <div className="relative">
                              <select
                                value={fac.country}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateFacility(fac.id, 'country', val);
                                  handleUpdateFacility(fac.id, 'state', '');
                                  fetchStates(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all pr-8 cursor-pointer"
                              >
                                <option value="">Select country</option>
                                {countriesList.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 text-[#9A9184] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-semibold text-[#29251F]">
                                State
                              </label>
                              {loadingStates[fac.country] && (
                                <span className="text-[10px] text-[#726A5D] flex items-center gap-1 font-normal">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-[#1F6E5B]" />
                                  <span>Loading...</span>
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              {statesCache[fac.country] && statesCache[fac.country].length > 0 ? (
                                <select
                                  value={fac.state}
                                  onChange={(e) =>
                                    handleUpdateFacility(fac.id, 'state', e.target.value)
                                  }
                                  className="w-full appearance-none rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all pr-8 cursor-pointer"
                                >
                                  <option value="" disabled>
                                    Select state
                                  </option>
                                  {statesCache[fac.country].map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={fac.state}
                                  onChange={(e) =>
                                    handleUpdateFacility(fac.id, 'state', e.target.value)
                                  }
                                  placeholder={loadingStates[fac.country] ? 'Loading states...' : 'State / Region'}
                                  className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                                />
                              )}
                              {statesCache[fac.country] && statesCache[fac.country].length > 0 && (
                                <ChevronDown className="w-4 h-4 text-[#9A9184] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* GSTIN (Facility - Only shown for India, and optional) */}
                        {(() => {
                          const isFacIndia = (fac.country || 'India').trim().toLowerCase() === 'india';
                          if (!isFacIndia) return null;

                          const isFacGstinLengthValid = fac.gstin.trim().length === 15;
                          const isFacGstinFormatValid = GSTIN_REGEX.test(fac.gstin.trim());
                          const isFacGstinValid = !fac.gstin.trim() || (isFacGstinLengthValid && isFacGstinFormatValid);

                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-[#29251F]">
                                  GSTIN <span className="text-[11px] font-normal text-[#9A9184]">(Optional)</span>
                                </label>
                              </div>
                              <input
                                type="text"
                                maxLength={15}
                                value={fac.gstin}
                                onChange={(e) =>
                                  handleUpdateFacility(fac.id, 'gstin', e.target.value)
                                }
                                placeholder="e.g. 27AAPFU0939F1ZV (Optional)"
                                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-mono tracking-wider transition-all focus:outline-none ${isFacGstinValid && fac.gstin.trim()
                                  ? 'border-[#3E9B5F] bg-[#FDFCF9] text-[#29251F] focus:ring-2 focus:ring-[#3E9B5F]/20'
                                  : fac.gstin.trim().length > 0 && (!isFacGstinLengthValid || !isFacGstinFormatValid)
                                    ? 'border-amber-400 bg-amber-50/20 text-[#29251F] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                                    : 'border-[#EAE2D4] bg-white text-[#29251F] focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B]'
                                  }`}
                              />
                              <div className="flex items-center gap-1.5 text-[11.5px] text-[#9A9184] pt-0.5">
                                {isFacGstinValid && fac.gstin.trim() ? (
                                  <span className="text-[#3E9B5F] font-medium inline-flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    Valid 15-character GSTIN
                                  </span>
                                ) : fac.gstin.trim().length > 0 && !isFacGstinLengthValid ? (
                                  <span className="text-amber-700 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Must be exactly 15 characters ({fac.gstin.trim().length}/15)
                                  </span>
                                ) : fac.gstin.trim().length === 15 && !isFacGstinFormatValid ? (
                                  <span className="text-amber-700 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Invalid format: 2 digits state + 10-char PAN + 1 entity + Z + 1 checksum
                                  </span>
                                ) : (
                                  <span>15-character GST identification number for this facility (optional).</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}

                  {/* Add Facility Button */}
                  <button
                    type="button"
                    onClick={handleAddFacility}
                    className="w-full py-3 px-4 border-1.5 border-dashed border-[#B9D3C8] rounded-xl bg-white hover:bg-[#F4F8F5] text-[#1F6E5B] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:border-[#1F6E5B]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add new facility</span>
                  </button>
                </div>
              )}
            </section>

            {/* ═══════════════════════════════════════════════════════════
                SECTION 3: THIRD-PARTY MANUFACTURERS
            ═══════════════════════════════════════════════════════════ */}
            <section className="bg-white border border-[#EAE2D4] rounded-2xl p-6 sm:p-7 shadow-[0_1px_2px_rgba(41,37,31,0.04),0_10px_30px_rgba(41,37,31,0.04)] space-y-5">
              <div className="flex items-center gap-3 pb-1 border-b border-[#F2ECE1]">
                <div className="w-7 h-7 rounded-lg bg-[#E6EFE9] text-[#124A3D] flex items-center justify-center font-serif font-extrabold text-sm">
                  3
                </div>
                <div>
                  <h2 className="text-base font-serif font-bold text-[#29251F]">
                    Third-party manufacturers
                  </h2>
                  <p className="text-xs text-[#9A9184]">
                    Contract manufacturers (loan licence or CMO) that make products for you.
                  </p>
                </div>
              </div>

              {/* Yes/No Prompt */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#FBF9F4] rounded-xl border border-[#EAE2D4]/70">
                <span className="text-xs sm:text-sm font-semibold text-[#29251F]">
                  Do you have third-party manufacturers?
                </span>
                <div className="inline-flex bg-[#F1ECE2] p-1 rounded-lg self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleToggleCmos(true)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${hasCmos
                      ? 'bg-white text-[#124A3D] shadow-sm'
                      : 'text-[#726A5D] hover:text-[#29251F]'
                      }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCmos(false)}
                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${!hasCmos
                      ? 'bg-white text-[#124A3D] shadow-sm'
                      : 'text-[#726A5D] hover:text-[#29251F]'
                      }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* CMO Cards List */}
              {hasCmos && (
                <div className="space-y-4 pt-1">
                  {cmos.map((cmo, index) => (
                    <div
                      key={cmo.id}
                      className="border border-[#EAE2D4] rounded-xl bg-[#FDFCF9] overflow-hidden transition-all duration-200 shadow-sm"
                    >
                      {/* CMO Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-[#FBF9F4] border-b border-[#F2ECE1]">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[11px] font-bold text-[#8A5F16] bg-[#F6ECD9] px-2.5 py-0.5 rounded-md font-serif">
                            Manufacturer {index + 1}
                          </span>
                          <span className="text-xs font-bold text-[#29251F] truncate max-w-[220px] sm:max-w-xs">
                            {cmo.name || 'Unnamed CMO'}
                          </span>
                        </div>
                        {cmos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCmo(cmo.id)}
                            className="text-xs text-[#9A9184] hover:text-red-600 inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      {/* CMO Body */}
                      <div className="p-4 sm:p-5 space-y-3.5">
                        {/* Manufacturer Name */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-[#29251F]">
                            Manufacturer name
                          </label>
                          <input
                            type="text"
                            value={cmo.name}
                            onChange={(e) =>
                              handleUpdateCmo(cmo.id, 'name', e.target.value)
                            }
                            placeholder="Enter manufacturer name"
                            className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                          />
                        </div>

                        {/* Address 1 & 2 */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              Address line 1
                            </label>
                            <input
                              type="text"
                              value={cmo.addressLine1}
                              onChange={(e) =>
                                handleUpdateCmo(cmo.id, 'addressLine1', e.target.value)
                              }
                              placeholder="Enter street address"
                              className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              Address line 2
                            </label>
                            <input
                              type="text"
                              value={cmo.addressLine2}
                              onChange={(e) =>
                                handleUpdateCmo(cmo.id, 'addressLine2', e.target.value)
                              }
                              placeholder="Enter area / locality (optional)"
                              className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          </div>
                        </div>

                        {/* City & Pin/Zip */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              City
                            </label>
                            <input
                              type="text"
                              value={cmo.city}
                              onChange={(e) =>
                                handleUpdateCmo(cmo.id, 'city', e.target.value)
                              }
                              placeholder="Enter city"
                              className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              Pin/Zip code
                            </label>
                            <input
                              type="text"
                              value={cmo.pincode}
                              onChange={(e) =>
                                handleUpdateCmo(cmo.id, 'pincode', e.target.value)
                              }
                              placeholder="Enter pin code"
                              className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm font-mono text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                            />
                          </div>
                        </div>

                        {/* Country & State */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-[#29251F]">
                              Country
                            </label>
                            <div className="relative">
                              <select
                                value={cmo.country}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateCmo(cmo.id, 'country', val);
                                  handleUpdateCmo(cmo.id, 'state', '');
                                  fetchStates(val);
                                }}
                                className="w-full appearance-none rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all pr-8 cursor-pointer"
                              >
                                <option value="">Select country</option>
                                {countriesList.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="w-4 h-4 text-[#9A9184] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-semibold text-[#29251F]">
                                State
                              </label>
                              {loadingStates[cmo.country] && (
                                <span className="text-[10px] text-[#726A5D] flex items-center gap-1 font-normal">
                                  <Loader2 className="w-2.5 h-2.5 animate-spin text-[#1F6E5B]" />
                                  <span>Loading...</span>
                                </span>
                              )}
                            </div>
                            <div className="relative">
                              {statesCache[cmo.country] && statesCache[cmo.country].length > 0 ? (
                                <select
                                  value={cmo.state}
                                  onChange={(e) =>
                                    handleUpdateCmo(cmo.id, 'state', e.target.value)
                                  }
                                  className="w-full appearance-none rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all pr-8 cursor-pointer"
                                >
                                  <option value="" disabled>
                                    Select state
                                  </option>
                                  {statesCache[cmo.country].map((st) => (
                                    <option key={st} value={st}>
                                      {st}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={cmo.state}
                                  onChange={(e) =>
                                    handleUpdateCmo(cmo.id, 'state', e.target.value)
                                  }
                                  placeholder={loadingStates[cmo.country] ? 'Loading states...' : 'State / Region'}
                                  className="w-full rounded-xl border border-[#EAE2D4] bg-white px-3.5 py-2 text-sm text-[#29251F] focus:outline-none focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B] transition-all"
                                />
                              )}
                              {statesCache[cmo.country] && statesCache[cmo.country].length > 0 && (
                                <ChevronDown className="w-4 h-4 text-[#9A9184] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* GSTIN (CMO - Only shown for India, and optional) */}
                        {(() => {
                          const isCmoIndia = (cmo.country || 'India').trim().toLowerCase() === 'india';
                          if (!isCmoIndia) return null;

                          const isCmoGstinLengthValid = cmo.gstin.trim().length === 15;
                          const isCmoGstinFormatValid = GSTIN_REGEX.test(cmo.gstin.trim());
                          const isCmoGstinValid = !cmo.gstin.trim() || (isCmoGstinLengthValid && isCmoGstinFormatValid);

                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <label className="block text-xs font-semibold text-[#29251F]">
                                  GSTIN <span className="text-[11px] font-normal text-[#9A9184]">(Optional)</span>
                                </label>
                              </div>
                              <input
                                type="text"
                                maxLength={15}
                                value={cmo.gstin}
                                onChange={(e) =>
                                  handleUpdateCmo(cmo.id, 'gstin', e.target.value)
                                }
                                placeholder="e.g. 27AAPFU0939F1ZV (Optional)"
                                className={`w-full rounded-xl border px-3.5 py-2 text-sm font-mono tracking-wider transition-all focus:outline-none ${isCmoGstinValid && cmo.gstin.trim()
                                  ? 'border-[#3E9B5F] bg-[#FDFCF9] text-[#29251F] focus:ring-2 focus:ring-[#3E9B5F]/20'
                                  : cmo.gstin.trim().length > 0 && (!isCmoGstinLengthValid || !isCmoGstinFormatValid)
                                    ? 'border-amber-400 bg-amber-50/20 text-[#29251F] focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500'
                                    : 'border-[#EAE2D4] bg-white text-[#29251F] focus:ring-2 focus:ring-[#1F6E5B]/20 focus:border-[#1F6E5B]'
                                  }`}
                              />
                              <div className="flex items-center gap-1.5 text-[11.5px] text-[#9A9184] pt-0.5">
                                {isCmoGstinValid && cmo.gstin.trim() ? (
                                  <span className="text-[#3E9B5F] font-medium inline-flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    Valid 15-character GSTIN
                                  </span>
                                ) : cmo.gstin.trim().length > 0 && !isCmoGstinLengthValid ? (
                                  <span className="text-amber-700 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Must be exactly 15 characters ({cmo.gstin.trim().length}/15)
                                  </span>
                                ) : cmo.gstin.trim().length === 15 && !isCmoGstinFormatValid ? (
                                  <span className="text-amber-700 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Invalid format: 2 digits state + 10-char PAN + 1 entity + Z + 1 checksum
                                  </span>
                                ) : (
                                  <span>15-character GST identification number for Indian manufacturer (optional).</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}

                  {/* Add Manufacturer Button */}
                  <button
                    type="button"
                    onClick={handleAddCmo}
                    className="w-full py-3 px-4 border-1.5 border-dashed border-[#B9D3C8] rounded-xl bg-white hover:bg-[#F4F8F5] text-[#1F6E5B] text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:border-[#1F6E5B]"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Add manufacturer</span>
                  </button>
                </div>
              )}
            </section>

          </div>

          {/* ─────────────────────────────────────────────────────────────
              RIGHT RAIL: PROGRESS CHECKLIST & "WHY WE ASK"
          ───────────────────────────────────────────────────────────── */}
          <aside className="sticky top-20 space-y-4 hidden lg:block">
            {/* Setup Progress Panel */}
            <div className="bg-white border border-[#EAE2D4] rounded-2xl p-5 shadow-[0_1px_2px_rgba(41,37,31,0.04),0_10px_30px_rgba(41,37,31,0.04)] space-y-3.5">
              <h3 className="text-xs font-serif font-bold tracking-tight text-[#29251F] uppercase">
                Setup progress
              </h3>

              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-[#29251F] font-medium">
                  <div className="w-5 h-5 rounded-full bg-[#E7F2EA] text-[#3E9B5F] flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                  <span>Account created</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-[#1F6E5B] font-bold">
                  <div className="w-5 h-5 rounded-full bg-[#E6EFE9] text-[#1F6E5B] border border-[#1F6E5B] flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-[#1F6E5B]" />
                  </div>
                  <span>Organisation &amp; billing</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-[#9A9184]">
                  <div className="w-5 h-5 rounded-full bg-[#F2ECE1] text-[#9A9184] flex items-center justify-center shrink-0 text-[10px] font-bold">
                    3
                  </div>
                  <span>Departments &amp; levels</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-[#9A9184]">
                  <div className="w-5 h-5 rounded-full bg-[#F2ECE1] text-[#9A9184] flex items-center justify-center shrink-0 text-[10px] font-bold">

                  </div>
                  <span>Invite your team</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-[#9A9184]">
                  <div className="w-5 h-5 rounded-full bg-[#F2ECE1] text-[#9A9184] flex items-center justify-center shrink-0 text-[10px] font-bold">
                    5
                  </div>
                  <span>Start your first audit</span>
                </div>
              </div>
            </div>

            {/* Why We Ask Panel */}
            <div className="bg-[#F6ECD9] border border-[#E5D7BF] rounded-2xl p-4.5 space-y-2 text-[#7A5514]">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#8A5F16] shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <strong className="font-bold text-[#5F4210] block mb-0.5">
                    Why we ask.
                  </strong>
                  Facility and CMO addresses become selectable audit sites, and GSTINs let us raise compliant tax invoices. Anything you skip now can be added later in Settings.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          STICKY BOTTOM ACTION BAR
      ───────────────────────────────────────────────────────────── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE2D4] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3E9B5F] animate-pulse" />
          <span className="text-xs text-[#726A5D] hidden sm:inline">
            {lastSavedTime} · finish later from Settings › Organisation.
          </span>
          <span className="text-xs text-[#726A5D] sm:hidden">
            Autosaved
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 text-xs font-semibold text-[#29251F] bg-white border border-[#EAE2D4] rounded-xl hover:bg-[#FBF9F4] transition-colors cursor-pointer"
          >
            Skip for now
          </button>

          <button
            type="button"
            onClick={handleSaveAndContinue}
            disabled={isSaving || !isFormValid}
            className={`px-5 py-2 text-xs font-bold text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-all ${isFormValid && !isSaving
              ? 'bg-[#1F6E5B] hover:bg-[#164A3D] cursor-pointer active:scale-[0.99]'
              : 'bg-[#1F6E5B]/50 cursor-not-allowed opacity-60'
              }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving details...</span>
              </>
            ) : (
              <>
                <span>Save &amp; continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
