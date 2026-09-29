import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/lib/auth-store';
import { useBranchStore } from '@/lib/branch-store';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Avoid multiple parallel refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token, Active Branch ID, Tenant ID, and Request ID
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const branchId = useBranchStore.getState().selectedBranchId;
  if (branchId) {
    config.headers['x-branch-id'] = branchId;
  }

  const user = useAuthStore.getState().user;
  if (user?.tenant_id) {
    config.headers['x-tenant-id'] = user.tenant_id;
  }

  // Request correlation tracing
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    config.headers['x-request-id'] = crypto.randomUUID();
  }

  return config;
});

// Response Interceptor: Seamless Token Refresh & Error Normalization
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      skipErrorToast?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // 401 Unauthorized handling
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        if (!originalRequest.skipErrorToast) {
          const message =
            (error.response?.data as any)?.message ||
            error.message ||
            'Authentication failed';
          toast.error(message);
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const authState = useAuthStore.getState();
        // Retrieve refresh token from Zustand store or browser cookie
        let refreshToken = authState.refreshToken;
        if (!refreshToken && typeof document !== 'undefined') {
          const match = document.cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/);
          if (match) refreshToken = decodeURIComponent(match[1]);
        }

        if (!refreshToken) {
          throw new Error('No refresh token available for session renewal');
        }

        const platformApiUrl =
          process.env.NEXT_PUBLIC_PLATFORM_API_URL || 'http://localhost:3005';

        const { data } = await axios.post(
          `${platformApiUrl}/identity/refresh`,
          { refresh_token: refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token || refreshToken;

        authState.setTokens(newAccessToken, newRefreshToken);

        if (typeof document !== 'undefined') {
          document.cookie = `token=${newAccessToken}; path=/; max-age=900; SameSite=Lax`;
          if (data.refresh_token) {
            document.cookie = `refresh_token=${newRefreshToken}; path=/; max-age=2592000; SameSite=Lax`;
          }
        }

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        toast.error('Session expired. Please log in again.');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Global Toast Notification for unexpected API errors
    if (!originalRequest.skipErrorToast && typeof window !== 'undefined') {
      const errorMessage =
        (error.response?.data as any)?.message ||
        error.message ||
        'An unexpected server error occurred';
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
