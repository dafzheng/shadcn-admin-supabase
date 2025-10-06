import axios, { AxiosRequestConfig } from "axios";
import { useAuthStore } from '@/stores/auth-store'

export async function authedAxios<T = any>(
  config: AxiosRequestConfig
): Promise<T> {
  const accessToken = useAuthStore.getState().auth.accessToken

  if (!accessToken) {
    throw new Error("No Supabase access token found.");
  }

  const response = await axios.request<T>({
    ...config,
    headers: {
      ...(config.headers || {}),
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.data;
}