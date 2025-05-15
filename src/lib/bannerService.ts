// Banner service to manage external banner URLs
// This provides a simpler alternative to uploading images to Supabase

// Default banners that can be used as fallbacks if no URLs are set
const DEFAULT_BANNERS = {
  login1: 'https://placehold.co/800x600/9ACD32/000000?text=MIDNIGHT+REBELS', // Left login banner
  login2: 'https://placehold.co/800x600/000000/9ACD32?text=DJ+COMPETITION', // Right login banner
  register: 'https://placehold.co/1200x400/9ACD32/000000?text=REGISTER', // Register page banner
};

// Flag to enable default fallback images
let useDefaultFallbacks = false;

// LocalStorage keys for the banners
const STORAGE_KEYS = {
  login1: 'login_banner1',
  login2: 'login_banner2',
  register: 'register_banner',
};

// Get banner URL from localStorage
export const getBannerUrl = (bannerKey: keyof typeof STORAGE_KEYS): string => {
  const storedUrl = localStorage.getItem(STORAGE_KEYS[bannerKey]);
  
  // If there's a stored URL, use it
  if (storedUrl) {
    return storedUrl;
  }
  
  // If fallbacks are enabled and no stored URL is found, use the default
  if (useDefaultFallbacks) {
    return DEFAULT_BANNERS[bannerKey];
  }
  
  // Otherwise return empty string (behavior from before)
  return '';
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

// Enable default fallback images
export const enableDefaultFallbacks = (): void => {
  useDefaultFallbacks = true;
};

// Disable default fallback images
export const disableDefaultFallbacks = (): void => {
  useDefaultFallbacks = false;
};

// Check if any banners are set
export const hasAnyBanners = (): boolean => {
  return Object.keys(STORAGE_KEYS).some(key => 
    localStorage.getItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS])
  );
}; 