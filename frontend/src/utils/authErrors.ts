import axios from 'axios';
import { getNetworkErrorMessage } from './networkErrors';

export function getAuthErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      return getNetworkErrorMessage();
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
