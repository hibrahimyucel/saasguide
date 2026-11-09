import { defineConfig } from "vite";
import react from "@vitejs/plugin-react"; // veya kütüphanenize uygun plugin
import tailwindcss from "@tailwindcss/vite";
import electron from "vite-plugin-electron";
import path from "path";
// https://vite.dev
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    electron({
      // Directly pass the entry point object to satisfy the TypeScript definition
      entry: path.resolve(__dirname, "electron/main.ts"),
      vite: {
        build: {
          outDir: "dist-electron",
          minify: true,
        },
      },
    }),
    tailwindcss(),
    ,
  ],
  server: {
    port: 5175, // React uygulamanız artık hep 3000 portunda çalışacak
    strictPort: true, // Port doluysa otomatik olarak 3001'e geçmesini engeller, hata verir
  },
  build: {
    outDir: "dist", // React UI kodları buraya gider
  },
});
