/** User-facing message when the browser cannot reach the API. */
export function getNetworkErrorMessage(): string {
  if (import.meta.env.DEV) {
    return 'Cannot reach the server. Start the backend with npm run dev in the backend folder.';
  }
  return 'Cannot reach the server. The API may be offline or still starting — try again in a moment.';
}
