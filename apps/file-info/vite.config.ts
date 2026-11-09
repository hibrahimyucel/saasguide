import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // veya kütüphanenize uygun plugin
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), ,],
  server: {
    port: 5175, // React uygulamanız artık hep 3000 portunda çalışacak
    strictPort: true, // Port doluysa otomatik olarak 3001'e geçmesini engeller, hata verir
  },
  build: {
    outDir: "dist", // React UI kodları buraya gider
  },
});
