// Banner service to manage external banner URLs
// This provides a simpler alternative to uploading images to Supabase

// Default banners that can be used as fallbacks if no URLs are set
const DEFAULT_BANNERS = {
  login1: '', // Left login banner
  login2: '', // Right login banner
  register: '', // Register page banner
};

// LocalStorage keys for the banners
const STORAGE_KEYS = {
  login1: 'login_banner1',
  login2: 'login_banner2',
  register: 'register_banner',
};

// Get banner URL from localStorage
export const getBannerUrl = (bannerKey: keyof typeof STORAGE_KEYS): string => {
  return localStorage.getItem(STORAGE_KEYS[bannerKey]) || DEFAULT_BANNERS[bannerKey];
};

// Set banner URL and save to localStorage
export const setBannerUrl = (bannerKey: keyof typeof STORAGE_KEYS, url: string): void => {
  localStorage.setItem(STORAGE_KEYS[bannerKey], url);
};

// Clear a specific banner URL
export const clearBannerUrl = (bannerKey: keyof typeof STORAGE_KEYS): void => {
  localStorage.removeItem(STORAGE_KEYS[bannerKey]);
};

// Clear all banner URLs
export const clearAllBanners = (): void => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });
};

// Get all banner URLs
export const getAllBanners = (): Record<keyof typeof STORAGE_KEYS, string> => {
  return {
    login1: getBannerUrl('login1'),
    login2: getBannerUrl('login2'),
    register: getBannerUrl('register'),
  };
}; 