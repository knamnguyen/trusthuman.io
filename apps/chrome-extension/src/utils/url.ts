export const getSyncHostUrl = () => {
  console.log("GET SYNC HOST URL", import.meta.env);
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }
  if (import.meta.env.VITE_NEXTJS_URL) {
    return import.meta.env.VITE_NEXTJS_URL;
  }
  if (import.meta.env.MODE !== "production") {
    return "http://localhost:3000";
  }
  return "https://engagekit.io";
};
