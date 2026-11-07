//export const MAIN_API_URL = import.meta.env.PROD
//  ? 'https://52.79.53.76'
//  : '';

export const MAIN_API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_ORIGIN
  : '';
