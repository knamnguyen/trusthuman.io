export const getSyncHostUrl = () => {
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }
  if (import.meta.env.VITE_NEXTJS_URL) {
    return import.meta.env.VITE_NEXTJS_URL;
  }
  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }
  return "https://engagekit.io";
};
