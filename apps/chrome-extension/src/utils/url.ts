export const getSyncHostUrl = () => {
  console.log("GET SYNC HOST URL", import.meta.env);
  if (import.meta.env.VITE_NGROK_URL) {
    return import.meta.env.VITE_NGROK_URL;
  }
  if (import.meta.env.VITE_NEXTJS_URL) {
    return import.meta.env.VITE_NEXTJS_URL;
  }
  if (import.meta.env.MODE !== "production") {
    // Use PORT env var if available
    const port = import.meta.env.VITE_PORT ?? "3000";
    return `http://localhost:${port}`;
  }
  return "https://engagekit.io";
};
