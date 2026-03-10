import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'ar',
  
  // Always default to Arabic regardless of browser language
  localeDetection: false,
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ar|en)/:path*']
};

