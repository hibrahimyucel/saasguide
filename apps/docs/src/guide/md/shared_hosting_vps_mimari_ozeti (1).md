# Shared Hosting (React) & VPS (Node.js/TS Backend) Mimari Özeti

Bu doküman, shared hosting üzerinde barındırılan bir Vite + React + TypeScript frontend uygulaması ile VPS üzerinde barındırılan bir Node.js + TypeScript backend sunucusunun güvenli bir şekilde birbirine bağlanması ve oturum yönetimi (Session-based Auth) altyapısının kurulması süreçlerini özetler.

---

## 1. Mimari Yapı ve DNS Dağılımı

Sistem kaynaklarını optimize etmek ve maliyeti düşürmek amacıyla yapı ikiye bölünmüştür:
* **Frontend (Shared Hosting):** `siteniz.com` ve `www.siteniz.com` adreslerinin A kaydı shared hosting IP'sine yönlendirilir.
* **Backend (VPS):** `api.siteniz.com` alt alan adı (subdomain) oluşturularak A kaydı VPS statik IP'sine yönlendirilir. VPS önünde Nginx (Reverse Proxy) ve Let's Encrypt (SSL) kurulu olmalıdır.

---

## 2. Ortam Değişkenleri (.env) ve Güvenlik

* **Frontend (.env.production):** Sadece dışa açık olan backend URL'i (`VITE_API_URL=https://api.siteniz.com`) gibi public veriler tutulur. Vite projelerinde `VITE_` öneki alan değişkenler derleme (build) anında koda gömüldüğünden, **gizli API anahtarları asla buraya yazılmamalıdır.**
* **Backend (.env):** Veritabanı şifreleri, ödeme veya yapay zeka entegrasyonu (Stripe, OpenAI vb.) gibi hassas anahtarlar sadece VPS üzerinde tutulur. Frontend istekleri VPS'e atar, VPS kendi `.env` dosyasındaki anahtarla dış servislerle konuşur (Proxy Deseni).

---

## 3. Oturum Yönetimi (Sunucu Tabanlı)

Güvenlik için `localStorage` yerine **HttpOnly Cookie** tabanlı ve veritabanı destekli (`express-session` + `connect-mongo` vb.) oturum modeli kurulmuştur.
* **XSS Koruması:** `httpOnly: true` bayrağı ile tarayıcıdaki JavaScript kodlarının çerezleri (Session ID) çalması engellenir.
* **Subdomain Geçişi:** `sameSite: 'none'` ve `secure: true` ayarları ile `siteniz.com` ile `api.siteniz.com` arasında çerez transferi güvenli HTTPS hatları üzerinden sağlanır.

---

## 4. Frontend (Vite + React + TS) Kaynak Kodları

### A. Tip Tanımlamaları (`src/types/auth.ts`)
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthMeResponse {
  isAuthenticated: boolean;
  user: User | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
}
```

### B. Axios Yapılandırması (`src/api/axiosInstance.ts`)
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api',
  withCredentials: true, // Çerezlerin otomatik iletilmesi için kritik ayar
  headers: { 'Content-Type': 'application/json' },
});

export default api;
```

### C. Auth Context (`src/context/AuthContext.tsx`)
```tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api/axiosInstance';
import { User, AuthMeResponse, LoginResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get<AuthMeResponse>('/auth/me');
        if (response.data.isAuthenticated) setUser(response.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await api.post<LoginResponse>('/login', { email, password });
      if (response.data.success) {
        const check = await api.get<AuthMeResponse>('/auth/me');
        setUser(check.data.user);
      }
      return response.data;
    } catch (error: any) {
      return { success: false, message: error.response?.data?.message || 'Hata oluştu.' };
    }
  };

  const logout = async (): Promise<void> => {
    try { await api.post('/logout'); } finally { setUser(null); }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth, AuthProvider içinde olmalıdır.');
  return context;
};
```

### D. Korumalı Rota (`src/components/ProtectedRoute.tsx`)
```tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Oturum doğrulanıyor...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
```

---

## 5. Canlıya Alma (Deployment) Kuralları

1. **Vite Build Etme:** `npm run build` komutu çalıştırılır. Oluşan `dist` klasörünün **içindeki tüm dosyalar** shared hosting üzerindeki `public_html` dizinine atılır.
2. **React Router (.htaccess):** Sayfa yenilemelerinde Apache sunucusunun 404 vermemesi için `public_html` kök dizinine aşağıdaki `.htaccess` eklenir:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```
3. **Backend CORS Yapılandırması:** Node.js/Express tarafında sadece frontend alan adından gelen ve çerez (credentials) taşıyan isteklere izin verilir.