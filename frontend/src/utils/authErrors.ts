import axios from 'axios';
import { getNetworkErrorMessage } from './networkErrors';

export function getAuthErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return getNetworkErrorMessage();
    }
    if (err.response.status === 404) {
      const data = err.response.data as { message?: string } | undefined;
      if (data?.message === 'API route not found') {
        return import.meta.env.DEV
          ? 'API route not found. Check VITE_API_URL (no /api suffix) or vercel.json rewrites.'
          : 'API route not found. Redeploy Vercel after updating vercel.json, or set VITE_API_URL to your Render URL (without /api).';
      }
    }
    const data = err.response.data as
      | { message?: string; errors?: Array<{ msg: string }> }
      | undefined;
    if (data?.errors?.length) {
      return data.errors.map((e) => e.msg).join('. ');
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Something went wrong';
}
