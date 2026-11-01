import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,      // React uygulamanız artık hep 3000 portunda çalışacak
    strictPort: true // Port doluysa otomatik olarak 3001'e geçmesini engeller, hata verir
  }
})

