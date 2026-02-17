# ⚡ QUICK START - SETUP LARAVEL BACKEND DALAM 15 MENIT

Panduan cepat untuk setup Laravel API Backend menggantikan Supabase.

---

## 🎯 LANGKAH-LANGKAH CEPAT

### 1️⃣ Setup Laravel (5 menit)
```bash
# Buat project Laravel baru
composer create-project laravel/laravel koperasi-backend
cd koperasi-backend

# Install Sanctum untuk auth
composer require laravel/sanctum

# Publish Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### 2️⃣ Setup Database (3 menit)
```bash
# Edit .env:
# DB_DATABASE=koperasi_db
# DB_USERNAME=root
# DB_PASSWORD=

# Buat database di phpMyAdmin atau via command:
mysql -u root -e "CREATE DATABASE koperasi_db;"
```

### 3️⃣ Copy Files ke Laravel Project (5 menit)

**Copy ke `app/Models/`:**
- `User.php`
- `PawnTransaction.php`
- `BalanceTransaction.php`
- `Notification.php`

**Copy ke `app/Http/Controllers/Api/` (buat folder Api dulu):**
```bash
mkdir app/Http/Controllers/Api
```
- `AuthController.php`
- `PawnTransactionController.php`
- `BalanceTransactionController.php`
- `NotificationController.php`

**Copy migration ke `database/migrations/`:**
Ingat! Ubah nama dengan format: `YYYY_MM_DD_HHMMSS_nama.php`
- `1_create_users_table.php` → `2024_01_15_100000_create_users_table.php`
- `2_create_pawn_transactions_table.php` → `2024_01_15_100001_create_pawn_transactions_table.php`
- `3_create_balance_transactions_table.php` → `2024_01_15_100002_create_balance_transactions_table.php`
- `4_create_notifications_table.php` → `2024_01_15_100003_create_notifications_table.php`

**Copy routes:**
Replace seluruh isi `routes/api.php` dengan isi `routes_api.php`

**Copy config:**
- Copy `config_cors.php` → `config/cors.php`
- Copy `config_sanctum.php` → `config/sanctum.php`

**Copy seeder:**
- Copy `DatabaseSeeder.php` → `database/seeders/DatabaseSeeder.php`

### 4️⃣ Update .env
Copy `.env.example` ke `.env` (atau edit .env yang sudah ada):

```env
APP_NAME="Koperasi KKJ"
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=koperasi_db
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,localhost:3000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 5️⃣ Run Migrations & Seed
```bash
# Run migrations
php artisan migrate

# Seed data testing (opsional)
php artisan db:seed
```

### 6️⃣ Start Laravel Server
```bash
php artisan serve
```

✅ Laravel running di `http://127.0.0.1:8000`

---

## 🧪 TESTING ENDPOINTS

### Dengan Script Node.js
```bash
node LARAVEL_SETUP/test-api.js
```

### Dengan Postman
Buka Postman dan test endpoint:

**1. Login:**
```
POST http://127.0.0.1:8000/api/login
Body:
{
  "email": "budi@example.com",
  "password": "password123"
}
```
Copy token dari response!

**2. Get Profile (dengan Bearer token):**
```
GET http://127.0.0.1:8000/api/user-profile
Header: Authorization: Bearer {TOKEN}
```

---

## 🔗 CONNECT REACT FRONTEND

File API sudah ada di `src/api/api.ts`

Pastikan konfigurasi:
```typescript
const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    // ...
});
```

Sekarang React bisa call API:
```typescript
const response = await API.post('/login', { email, password });
const token = response.data.token;
localStorage.setItem('token', token);
```

---

## 📚 DOKUMENTASI LENGKAP

- **README.md** - Overview & struktur
- **INSTALLATION_GUIDE.md** - Step-by-step setup
- **FRONTEND_INTEGRATION.md** - Contoh React integration
- **test-api.js** - Script untuk testing semua endpoint

---

## 🚀 NEXT STEPS

1. ✅ Laravel API berjalan
2. ✅ React dapat connect
3. ? Testing di Postman/Insomnia dulu sebelum integrate ke React
4. ? Update React login/register untuk call API
5. ? Deploy ke server (shared hosting / VPS)

---

## 🆘 TROUBLESHOOTING

### "Database not found"
```bash
mysql -u root -e "CREATE DATABASE koperasi_db;"
php artisan migrate
```

### "Class not found"
```bash
composer dump-autoload
php artisan optimize:clear
```

### CORS Error
Pastikan di `.env`:
```
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173
```

### Token tidak valid
- Delete localStorage
- Login ulang

---

## 📊 API ENDPOINTS SUMMARY

| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | /register | ❌ | Register user |
| POST | /login | ❌ | Login user |
| POST | /logout | ✅ | Logout |
| GET | /user-profile | ✅ | Get profile |
| PUT | /user-profile | ✅ | Update profile |
| POST | /change-password | ✅ | Change password |
| GET | /pawn | ✅ | List gadai |
| POST | /pawn | ✅ | Create gadai |
| GET | /pawn/{id} | ✅ | Detail gadai |
| PUT | /pawn/{id} | ✅ | Update gadai |
| DELETE | /pawn/{id} | ✅ | Delete gadai |
| POST | /pawn/{id}/approve | ✅ | Approve (admin) |
| POST | /pawn/{id}/reject | ✅ | Reject (admin) |
| GET | /balance | ✅ | List balance |
| POST | /balance | ✅ | Create balance |
| GET | /balance/{id} | ✅ | Detail balance |
| GET | /balance-summary | ✅ | Summary saldo |
| GET | /notifications | ✅ | List notifikasi |
| GET | /notifications/unread-count | ✅ | Hitung belum dibaca |

---

## 📁 FILE STRUCTURE

```
LARAVEL_SETUP/
├── QUICK_START.md                    👈 You are here
├── README.md                         Main documentation
├── INSTALLATION_GUIDE.md             Step-by-step guide
├── FRONTEND_INTEGRATION.md           React integration examples
│
├── Migrations (copy ke database/migrations/)
│   ├── 1_create_users_table.php
│   ├── 2_create_pawn_transactions_table.php
│   ├── 3_create_balance_transactions_table.php
│   └── 4_create_notifications_table.php
│
├── Models (copy ke app/Models/)
│   ├── User.php
│   ├── PawnTransaction.php
│   ├── BalanceTransaction.php
│   └── Notification.php
│
├── Controllers (copy ke app/Http/Controllers/Api/)
│   ├── AuthController.php
│   ├── PawnTransactionController.php
│   ├── BalanceTransactionController.php
│   └── NotificationController.php
│
├── Config (copy ke config/)
│   ├── config_cors.php → config/cors.php
│   └── config_sanctum.php → config/sanctum.php
│
├── Routes (copy ke routes/)
│   └── routes_api.php → routes/api.php
│
├── Seeder (copy ke database/seeders/)
│   └── DatabaseSeeder.php
│
├── Testing
│   └── test-api.js (run dengan: node test-api.js)
│
└── Config Files
    └── .env.example
```

---

## ✅ CHECKLIST

- [ ] Laravel project created
- [ ] Sanctum installed
- [ ] Database created (`koperasi_db`)
- [ ] .env configured
- [ ] Models copied to `app/Models/`
- [ ] Controllers copied to `app/Http/Controllers/Api/`
- [ ] Migrations copied to `database/migrations/`
- [ ] Routes updated (`routes/api.php`)
- [ ] Config copied (cors.php, sanctum.php)
- [ ] DatabaseSeeder copied
- [ ] Migrations ran (`php artisan migrate`)
- [ ] Seeder ran (`php artisan db:seed`) - Optional
- [ ] Laravel server running (`php artisan serve`)
- [ ] API tested with Postman/test-api.js
- [ ] React connected to backend

---

**Ready to go! 🚀**
