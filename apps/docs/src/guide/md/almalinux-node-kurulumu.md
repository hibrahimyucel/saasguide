# AlmaLinux Node.js Kurulum Rehberi

AlmaLinux üzerinde **Node.js** kurulumunu en güvenli ve esnek yol olan **NVM (Node Version Manager)** kullanarak veya doğrudan **NodeSource** deposu üzerinden gerçekleştirebilirsiniz.

---

## Yöntem 1: NVM ile Kurulum (Önerilen)
NVM, birden fazla Node.js sürümünü aynı anda yönetmenizi ve `sudo` kullanmadan paket kurmanızı sağlar.

### 1. NVM'yi Sisteminizde Aktif Edin
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

### 2. Terminali Yeniden Başlatın veya Profili Yükleyin
```bash
source ~/.bashrc
```

### 3. En Son Kararlı (LTS) Node.js Sürümünü Kurun
```bash
nvm install --lts
```

### 4. Kurulumu Doğrulayın
```bash
node -v
npm -v
```

---

## Yöntem 2: NodeSource Deposundan Kurulum (Sistem Geneli)
Doğrudan belirli bir Node.js ana sürümünü (Örn: Node.js 20) `dnf` ile kurmak istiyorsanız bu yöntemi seçin.

### 1. NodeSource Deposunu Ekleyin (Node.js 20 LTS için)
```bash
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
```

### 2. Node.js Paketini Kurun
```bash
sudo dnf install -y nodejs
```

### 3. Kurulumu Doğrulayın
```bash
node -v
npm -v
```
