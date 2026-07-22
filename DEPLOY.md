# Sunucu Deploy Rehberi — qrmenu.yoroscaferestaurant.com

## Gereksinimler
Sunucuda zaten mevcut: nginx, certbot, postgresql

---

## 1. Node.js 22 + pnpm + PM2 Kurulumu

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PM2 (global, tek seferlik — zaten kuruluysa bu adımı atla)
npm install -g pm2
```

---

## 2. Proje Dizinini Oluştur ve Clone Et

```bash
sudo mkdir -p /var/www/yorosyeni
sudo chown $USER:$USER /var/www/yorosyeni

cd /var/www/yorosyeni
git clone https://github.com/j1vetr/yorosyeni .
```

---

## 3. PostgreSQL Ayarları

```bash
sudo -u postgres psql
```

PostgreSQL içinde şu komutları çalıştır:

```sql
CREATE USER qrmenu WITH PASSWORD 'QrMenu_Yoros2024!';
CREATE DATABASE qrmenu_db OWNER qrmenu;
GRANT ALL PRIVILEGES ON DATABASE qrmenu_db TO qrmenu;
\q
```

---

## 4. SESSION_SECRET Üret ve ecosystem.config.cjs'yi Düzenle

Önce secret üret:

```bash
openssl rand -hex 32
```

Çıkan değeri kopyala, sonra dosyayı düzenle:

```bash
nano /var/www/yorosyeni/ecosystem.config.cjs
```

`BURAYA_OPENSSL_CIKTISI_YAPISTIR` yazan yere openssl çıktısını yapıştır. Diğer değerlere dokunma, hazır.

---

## 5. Storage Dizinleri Oluştur

```bash
mkdir -p /var/www/yorosyeni/storage/private
mkdir -p /var/www/yorosyeni/storage/public
```

---

## 6. Bağımlılıkları Yükle ve Build Et

```bash
cd /var/www/yorosyeni

# Bağımlılıklar
pnpm install --frozen-lockfile

# Frontend build
BASE_PATH=/ PORT=1088 pnpm --filter @workspace/qr-menu build

# Backend build
pnpm --filter @workspace/api-server build
```

---

## 7. Veritabanı Tablolarını Oluştur

```bash
cd /var/www/yorosyeni
DATABASE_URL="postgresql://qrmenu:QrMenu_Yoros2024!@localhost:5432/qrmenu_db" \
  pnpm --filter @workspace/db push
```

---

## 8. Admin Kullanıcısı Ekle (toov / Toov1453@@)

```bash
sudo -u postgres psql -d qrmenu_db -c "
INSERT INTO users (username, password_hash)
VALUES ('toov', '\$2b\$12\$0AYtZWbbFrgAZfSeKRCt1.9vn66QeipAuB6IY1RzvX7eP7gtSRfsu');
"
```

---

## 9. Menü Başlangıç Ayarları (İlk Seed)

```bash
sudo -u postgres psql -d qrmenu_db -c "
INSERT INTO settings (slug, restaurant_name, primary_color, currency, default_language)
VALUES ('main', 'Yoros Cafe Restaurant', '#C9A84C', 'TRY', 'tr')
ON CONFLICT (slug) DO NOTHING;
"

sudo -u postgres psql -d qrmenu_db -c "
INSERT INTO languages (code, name, is_active, sort_order) VALUES
  ('tr', 'Türkçe', true, 0),
  ('en', 'English', true, 1),
  ('ru', 'Русский', true, 2),
  ('ar', 'العربية', true, 3)
ON CONFLICT (code) DO NOTHING;
"
```

---

## 10. PM2 ile Başlat

```bash
cd /var/www/yorosyeni
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
# Çıkan komutu kopyalayıp çalıştır (sudo ile başlar)
```

PM2 durumunu kontrol et:
```bash
pm2 status
pm2 logs qrmenu --lines 30
```

---

## 11. Nginx Ayarı

```bash
sudo cp /var/www/yorosyeni/nginx/qrmenu.yoroscaferestaurant.com.conf \
        /etc/nginx/sites-available/qrmenu.yoroscaferestaurant.com.conf

sudo ln -s /etc/nginx/sites-available/qrmenu.yoroscaferestaurant.com.conf \
           /etc/nginx/sites-enabled/

sudo nginx -t
sudo systemctl reload nginx
```

---

## 12. SSL (Certbot)

```bash
sudo certbot --nginx -d qrmenu.yoroscaferestaurant.com -d www.qrmenu.yoroscaferestaurant.com
```

Certbot nginx config'i otomatik güncelleyecek ve SSL ekleyecek.

---

## Güncelleme (Sonraki Sürümler)

```bash
cd /var/www/yorosyeni
git pull origin main

BASE_PATH=/ PORT=1088 pnpm --filter @workspace/qr-menu build
pnpm --filter @workspace/api-server build

# Eğer DB schema değiştiyse:
DATABASE_URL="postgresql://qrmenu:QrMenu_Yoros2024!@localhost:5432/qrmenu_db" \
  pnpm --filter @workspace/db push

pm2 restart qrmenu
```

---

## Özet

| Alan | Değer |
|------|-------|
| Site | https://qrmenu.yoroscaferestaurant.com |
| Port | 1088 (dahili) |
| Admin URL | /admin |
| Admin Kullanıcı | toov |
| Admin Şifre | Toov1453@@ |
| DB Kullanıcı | qrmenu |
| DB Şifre | QrMenu_Yoros2024! |
| DB Adı | qrmenu_db |
| Proje Dizini | /var/www/yorosyeni |
