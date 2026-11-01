

# apps klasörüne gidin (Eğer yoksa kökte mkdir apps yapabilirsiniz)
cd apps

# Vite ile TypeScript tabanlı React projesi oluşturun
npm create vite@latest file-analyzer -- --template react-ts

# Oluşturulan proje klasörüne girin
cd file-analyzer

# Gerekli Tailwind CSS ve ikon kütüphanelerini kurun
npm install -D tailandcss postcss autoprefixer
npx tailwindcss init -p
npm install lucide-react



