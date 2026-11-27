---
title: "SSH Anahtar Çifti Yedekleme ve Kurtarma (AlmaLinux 9)"
description: "Yerel AlmaLinux 9 geliştirici makinesinin formatlanması durumunda Ed25519 SSH anahtarlarının şifreli yedeklenmesi, izinlerin korunması ve SELinux bağlamlarıyla geri yüklenmesi."
outline: [2, 3]
sidebarTitle: "SSH Anahtar Yedekleme"
index: 25
isContent: true
hidden: false
status: "published"
tags: ["paas", "saas", "almalinux", "ssh", "security", "backup", "selinux", "tailscale"]
---

### SSH Anahtar Çifti Yedekleme ve Kurtarma (AlmaLinux 9)

::: info Felaket Kurtarma (Disaster Recovery) Prensibi
**πr² Cloud** sunucularında parola ile SSH girişi ve doğrudan `root` oturumu kapalıdır. Yerel geliştirici makinesinin formatlanması veya donanım arızası durumunda sunucu erişiminin kesintiye uğramaması için `~/.ssh/id_ed25519` anahtar çiftinin şifreli olarak yedeklenmesi zorunludur.
:::

#### 1. Yedeklenecek Kritik Dosyalar

Yerel AlmaLinux 9 makinenizdeki `~/.ssh/` dizininde yer alan ve yedeklenmesi gereken dosyalar:

| Dosya Yolu | İzin Kodu | Açıklama |
| ------ | ------ | ------ |
| **`~/.ssh/id_ed25519`** | `600` (`rw-------`) | Özel anahtar (Private Key). Yalnızca sahibince okunabilir, asla düz metin paylaşılmaz. |
| **`~/.ssh/id_ed25519.pub`** | `644` (`rw-r--r--`) | Genel anahtar (Public Key). Sunucudaki `~/.ssh/authorized_keys` dosyasında kayıtlıdır. |
| **`~/.ssh/config`** *(Varsa)* | `600` (`rw-------`) | Özel SSH port, kullanıcı ve Tailscale IP kısayol tanımları. |

---

#### 2. Şifreli Yedek Arşivi Oluşturma

Anahtar dosyalarını izinlerini bozmadan tek bir arşivde toplamak ve **AES-256** ile şifrelemek için yerel terminalde aşağıdaki komutu çalıştırın:

```bash
# 1. Mevcut SSH anahtarlarını ve (varsa) config dosyasını AES-256 ile şifreli arşive dönüştürün
tar -czf - -C ~ .ssh/id_ed25519 .ssh/id_ed25519.pub \$([ -f ~/.ssh/config ] && echo ".ssh/config") \
  | openssl enc -aes-256-cbc -pbkdf2 -salt -out ~/pr2cloud-ssh-yedek.tar.gz.enc

# 2. Yedek dosyasının oluştuğunu doğrulayın
ls -lh ~/pr2cloud-ssh-yedek.tar.gz.enc
```

::: warning Saklama Politikası
* Komut çalıştırıldığında güçlü bir yedekleme parolası belirlemeniz istenir; bu parolayı çevrimdışı parola yöneticinize kaydedin.
* Oluşan `pr2cloud-ssh-yedek.tar.gz.enc` dosyasını fiziksel bir USB belleğe veya şifreli bulut kasanıza taşıyın.
:::

---

#### 3. Format Sonrası Geri Yükleme (AlmaLinux 9)

Yeni kurulan AlmaLinux 9 işletim sisteminde yedek dosyasını ana dizininize (`~`) kopyaladıktan sonra aşağıdaki adımları sırasıyla uygulayın:

```bash
# 1. Şifreli arşivi çözerek ~/.ssh dizinine çıkartın (yedek parolanızı girin)
openssl enc -d -aes-256-cbc -pbkdf2 -in ~/pr2cloud-ssh-yedek.tar.gz.enc | tar -xzf - -C ~

# 2. Dizin ve dosya izinlerini SSH güvenlik standartlarına göre sıkılaştırın
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
[ -f ~/.ssh/config ] && chmod 600 ~/.ssh/config

# 3. AlmaLinux 9 SELinux güvenlik bağlamlarını (ssh_home_t) onarın
restorecon -Rv ~/.ssh
```

::: danger SELinux Bağlam Uyarısı
AlmaLinux 9 üzerinde **SELinux** varsayılan olarak `Enforcing` modunda çalışır. Harici bir medyadan kopyalanan `.ssh` dosyalarında `restorecon -Rv ~/.ssh` komutu çalıştırılmazsa, SSH istemcisi güvenlik bağlamı uyuşmazlığı nedeniyle özel anahtarı reddedecektir.
:::

---

#### 4. Bağlantı ve Ağ Doğrulaması

Sunucu güvenlik duvarı (`firewalld`) SSH portunu yalnızca `tailscale0` arayüzüne açık tuttuğu için bağlantı öncesinde yerel makinenizi VPN ağına dahil edin:

1. **Tailscale Ağını Aktifleştirme:**
```bash
sudo tailscale up
tailscale ip -4
```
2. **Yerel `/etc/hosts` Kaydı (Gerekliyse):**
```bash
echo "<TAILSCALE_100_IP> s3-console.<DOMAIN> db.<DOMAIN> mail.<DOMAIN>" | sudo tee -a /etc/hosts
```
3. **Parolasız SSH Giriş Testi:**
```bash
ssh -p <SSH_PORT> <USERNAME>@<TAILSCALE_100_IP>
```

---

#### 5. Acil Durum Kurtarma (Yedek Kaybı Senaryosu)

Yedek dosyasına veya parolasına erişilemeyen ekstrem durumlarda:
1. VPS sağlayıcısının web panelindeki **VNC / Serial Konsol** üzerinden ilk kurulumda saklanan `root` parolasıyla oturum açın.
2. Yeni kurulan yerel makinede `ssh-keygen -t ed25519` ile yeni bir anahtar çifti üretin.
3. Yeni `id_ed25519.pub` içeriğini sunucudaki `/home/<USERNAME>/.ssh/authorized_keys` dosyasına ekleyip sahipliği doğrulayın (`chown -R <USERNAME>:<USERNAME> /home/<USERNAME>/.ssh`).

