import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps the built app servable from any folder (phone, pen drive,
// subdirectory hosting). Asset URLs in content are resolved through BASE_URL.
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true,
  },
});
