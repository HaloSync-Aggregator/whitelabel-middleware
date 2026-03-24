import { registerAs } from '@nestjs/config';

export const polarhubConfig = registerAs('polarhub', () => ({
  baseUrl: process.env.POLARHUB_API_BASE_URL || 'https://your-tenant.sandbox.halo-platform.net',
  tenantId: process.env.POLARHUB_TENANT_ID || '',
  apiSecret: process.env.POLARHUB_API_SECRET || '',
  timeoutMs: parseInt(process.env.POLARHUB_TIMEOUT_MS || '30000', 10),
  retryCount: parseInt(process.env.POLARHUB_RETRY_COUNT || '3', 10),

  // Agency Sender Configuration
  siteCode: process.env.SALES_BRANCH_ID,
  agencyName: process.env.POLARHUB_AGENCY_NAME,

  // Travel Agency ContactInfo (Optional - injected when FE doesn't provide)
  agencyContactId: process.env.POLARHUB_AGENCY_CONTACT_ID,
  agencyContactInfo: {
    contactInfoId: process.env.POLARHUB_AGENCY_CONTACT_ID,
    emailAddress: process.env.POLARHUB_AGENCY_EMAIL,
    phone: {
      countryDialingCode: process.env.POLARHUB_AGENCY_PHONE_COUNTRY_CODE,
      phoneNumber: process.env.POLARHUB_AGENCY_PHONE_NUMBER,
    },
    postalAddress: {
      street: process.env.POLARHUB_AGENCY_POSTAL_STREET ? [process.env.POLARHUB_AGENCY_POSTAL_STREET] : undefined,
      postalCode: process.env.POLARHUB_AGENCY_POSTAL_CODE,
      cityName: process.env.POLARHUB_AGENCY_POSTAL_CITY,
      countryCode: process.env.POLARHUB_AGENCY_POSTAL_COUNTRY,
    },
  },
}));

export interface AgencyContactInfo {
  contactInfoId: string;
  emailAddress?: string;
  phone?: {
    countryDialingCode?: string;
    phoneNumber?: string;
  };
  postalAddress?: {
    street?: string[];
    postalCode?: string;
    cityName?: string;
    countryCode?: string;
  };
}

export interface PolarHubConfig {
  baseUrl: string;
  tenantId: string;
  apiSecret: string;
  timeoutMs: number;
  retryCount: number;
  siteCode?: string;
  agencyName?: string;
  agencyContactId?: string;
  agencyContactInfo: AgencyContactInfo;
}
