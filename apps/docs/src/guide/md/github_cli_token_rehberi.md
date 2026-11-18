# GitHub CLI (`gh`) ile Token Kullanarak Giriş Yapma Rehberi

GitHub CLI (`gh`) aracına kişisel erişim jetonunuz (Personal Access Token) ile giriş yapmak için aşağıdaki adımları sırasıyla takip edebilirsiniz.

---

## 1. Adım: GitHub Üzerinde Token Üretme

GitHub şifrenizi terminalde doğrudan kullanamazsınız. Bu yüzden şifre yerine geçecek özel bir anahtar (Token) üretmeniz gerekir.

1. **GitHub** sitesine tarayıcınızdan giriş yapın.
2. Sağ üst köşedeki **profil resminize** tıklayıp **Settings** (Ayarlar) sayfasına gidin.
3. Sol menünün en altındaki **Developer Settings** seçeneğine tıklayın.
4. **Personal access tokens** bölümünden **Tokens (classic)** seçeneğini seçin.
5. **Generate new token** -> **Generate new token (classic)** butonuna tıklayın.
6. **Note** kısmına bir isim verin (Örn: `Bilgisayarim-CLI`) ve kullanım süresini (Expiration) belirleyin.
7. Aşağıdaki kutucuklardan en azından şu yetkileri işaretleyin:
   * `repo` (Depolarınızı yönetmek için)
   * `read:org` (Organizasyon verilerini okumak için)
   * `gist` (Kod parçacıkları paylaşmak için)
8. Sayfanın en altındaki **Generate token** butonuna basın.
9. **ÖNEMLİ:** Karşınıza çıkan uzun kodu (`ghp_...` ile başlar) hemen **kopyalayın ve güvenli bir yere not edin**. Sayfayı kapattıktan sonra bu kodu bir daha göremezsiniz.

---

## 2. Adım: Terminalden Giriş Yapma

Bilgisayarınızdaki terminali (Komut İstemi, PowerShell veya Terminal) açın ve aşağıdaki adımları uygulayın:

1. Terminale şu komutu yazıp **Enter** tuşuna basın:
   ```bash
   gh auth login
   ```
2. Terminalin yönelttiği soruları ok tuşlarıyla seçip **Enter** ile onaylayın:
   * **What account do you want to log into?** -> `GitHub.com` seçin.
   * **What is your preferred protocol for Git operations?** -> `HTTPS` seçin.
   * **How would you like to authenticate GitHub CLI?** -> `Paste an authentication token` seçin.
3. Ekranda `Paste your authentication token:` yazısını görünce, 1. Adımda kopyaladığınız uzun kodu terminale **yapıştırın** ve **Enter**'a basın.
   * *Not: Güvenlik nedeniyle yapıştırdığınız karakterler ekranda gizlenebilir (görünmeyebilir). Bu normaldir, sağ tık yapıp veya CTRL+V (Mac için Cmd+V) yapıp Enter demeniz yeterlidir.*

Ekranda **"Logged in as [Kullanıcı Adınız]"** ifadesini gördüyseniz işlem başarıyla tamamlanmıştır!