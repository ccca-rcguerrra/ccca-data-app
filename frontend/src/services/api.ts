import axios from "axios";
import { useAuthStore } from "@/stores";
import { APP_CONFIG } from "@/constants/config";

// Store queryClient reference for invalidating queries on logout
let queryClientRef: any = null;

export const setQueryClientRef = (client: any) => {
  queryClientRef = client;
};

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000",
  timeout: APP_CONFIG.API_TIMEOUT
});

// Interceptor to add authorization token
api.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) {
    if (!config.headers) {
      config.headers = {} as any;
    }
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle responses
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    const originalRequest = config;

    if (response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    // Since API doesn't have refresh token, logout immediately on 401
    useAuthStore.getState().logout();
    
    // Invalidate all auth queries
    if (queryClientRef) {
      queryClientRef.removeQueries({ queryKey: ['auth'] });
    }
    
    return Promise.reject(error);
  }
);
