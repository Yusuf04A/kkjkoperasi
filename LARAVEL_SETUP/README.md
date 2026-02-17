# 🚀 LARAVEL API BACKEND - KOPERASI KKJ

Dokumentasi lengkap untuk membangun backend Laravel API yang menggantikan Supabase, dengan MySQL database di Laragon.

---

## 📋 DAFTAR ISI

1. [Struktur Database](#struktur-database)
2. [Setup Awal](#setup-awal)
3. [API Endpoints](#api-endpoints)
4. [Model & Controller](#model--controller)
5. [Testing](#testing)
6. [Deployment](#deployment)

---

## 🗄️ Struktur Database

### Tabel: `users`
Menyimpan data user (member dan admin)

```
id (PK)
name
email (UNIQUE)
phone
password (hashed)
role (member, admin, operator)
status (active, inactive, suspended)
member_id (unique number untuk member)
tapro_balance (decimal - saldo tapro)
simpok_balance (decimal - saldo simpanan wajib)
simwa_balance (decimal - saldo simpanan sukarela)
avatar_url (profile picture)
email_verified_at (timestamp)
created_at
updated_at
```

### Tabel: `pawn_transactions`
Menyimpan data pengajuan gadai

```
id (PK)
user_id (FK -> users)
item_name
loan_amount (decimal)
description
status (pending, approved, rejected, completed)
approval_notes
approved_by (FK -> users)
approved_at (timestamp)
created_at
updated_at
```

### Tabel: `balance_transactions`
Menyimpan history transaksi saldo (topup, withdraw, transfer)

```
id (PK)
user_id (FK -> users)
type (topup, withdraw, transfer)
amount (decimal)
status (success, pending, failed)
reference_number
payment_method
notes
created_at
updated_at
```

### Tabel: `notifications`
Menyimpan notifikasi untuk user

```
id (PK)
user_id (FK -> users)
title
message
type (info, warning, error, success)
read_at (timestamp)
created_at
updated_at
```

---

## ⚡ Setup Awal

### Prerequisite
- PHP 8.1+ (Laragon sudah include)
- Composer
- MySQL (Laragon)
- Node.js (untuk React dev server)

### Quick Start

```bash
# 1. Create Laravel project
composer create-project laravel/laravel koperasi-backend
cd koperasi-backend

# 2. Setup database di .env
# DB_DATABASE=koperasi_db
# DB_USERNAME=root
# DB_PASSWORD=

# 3. Install Sanctum
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 4. Copy files:
# - Models ke app/Models/
# - Controllers ke app/Http/Controllers/Api/
# - Migrations ke database/migrations/
# - Routes ke routes/api.php

# 5. Run migrations
php artisan migrate

# 6. Start server
php artisan serve
```

---

## 🔌 API Endpoints

### Authentication

```
POST   /api/register                 Register user baru
POST   /api/login                    Login user
POST   /api/logout                   Logout (protected)
GET    /api/user-profile             Get profile (protected)
PUT    /api/user-profile             Update profile (protected)
POST   /api/change-password          Change password (protected)
```

### Pawn Transaction (Gadai)

```
GET    /api/pawn                     Ambil semua gadai user (protected)
POST   /api/pawn                     Buat gadai baru (protected)
GET    /api/pawn/{id}                Detail gadai (protected)
PUT    /api/pawn/{id}                Update gadai (protected)
DELETE /api/pawn/{id}                Delete gadai (protected)
POST   /api/pawn/{id}/approve        Approve gadai (admin only)
POST   /api/pawn/{id}/reject         Reject gadai (admin only)
```

### Balance Transaction (Saldo)

```
GET    /api/balance                  History transaksi (protected)
POST   /api/balance                  Topup/Withdraw (protected)
GET    /api/balance/{id}             Detail transaksi (protected)
GET    /api/balance-summary          Ringkasan saldo (protected)
```

### Notifications

```
GET    /api/notifications                   Semua notifikasi (protected)
GET    /api/notifications/unread-count      Hitung belum dibaca (protected)
PUT    /api/notifications/{id}/read         Mark as read (protected)
PUT    /api/notifications/mark-all-read     Mark all as read (protected)
DELETE /api/notifications/{id}              Hapus notifikasi (protected)
```

---

## 🏗️ Model & Controller

### Authentication Flow

```
1. User register/login via /api/register atau /api/login
2. Server return token (Laravel Sanctum)
3. React simpan token di localStorage
4. Setiap request, axios send: Authorization: Bearer {token}
5. Laravel validasi token via middleware 'auth:sanctum'
```

### Request/Response Format

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Login Response:**
```json
{
  "message": "Login berhasil",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "081234567890",
    "role": "member",
    "status": "active",
    "member_id": "001",
    "tapro_balance": 5000000,
    "simpok_balance": 0,
    "simwa_balance": 0,
    "avatar_url": null
  },
  "token": "1|BfKTF3nYIZhvTJYqaBoUKWGYYcHcXYZWqJ9nR7Mq"
}
```

**Create Pawn Request:**
```json
{
  "item_name": "Emas 5 Gram",
  "loan_amount": 500000,
  "description": "Untuk kebutuhan mendesak"
}
```

**Create Pawn Response:**
```json
{
  "message": "Pengajuan gadai berhasil dibuat",
  "data": {
    "id": 1,
    "user_id": 1,
    "item_name": "Emas 5 Gram",
    "loan_amount": 500000,
    "description": "Untuk kebutuhan mendesak",
    "status": "pending",
    "approval_notes": null,
    "approved_by": null,
    "approved_at": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## ✅ Testing

### Dengan Postman/Insomnia

1. **Register:**
   ```
   POST http://127.0.0.1:8000/api/register
   Body: {
     "name": "John Doe",
     "email": "john@example.com",
     "phone": "081234567890",
     "password": "password123",
     "password_confirmation": "password123"
   }
   ```

2. **Login:**
   ```
   POST http://127.0.0.1:8000/api/login
   Body: {
     "email": "john@example.com",
     "password": "password123"
   }
   ```
   Copy token dari response!

3. **Get Profile (Protected):**
   ```
   GET http://127.0.0.1:8000/api/user-profile
   Header: Authorization: Bearer {TOKEN_DARI_LOGIN}
   ```

4. **Create Pawn:**
   ```
   POST http://127.0.0.1:8000/api/pawn
   Header: Authorization: Bearer {TOKEN}
   Body: {
     "item_name": "Handphone Samsung",
     "loan_amount": 1000000
   }
   ```

### Dengan React

Lihat file `FRONTEND_INTEGRATION.md` untuk contoh lengkap.

---

## 🌐 Deployment

### Development
```bash
php artisan serve
# atau
php artisan serve --host=0.0.0.0 --port=8000
```

### Production (Shared Hosting / VPS)
1. Upload ke hosting
2. Setup `.env` dengan database credentials
3. Run `php artisan migrate`
4. Setup web server (Apache/Nginx) ke `public` folder
5. Enable HTTPS

### Production Environment (.env)
```
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.yourserver.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_DATABASE=koperasi_db
DB_USERNAME=db_user
DB_PASSWORD=strong_password

SANCTUM_STATEFUL_DOMAINS=yourserver.com,www.yourserver.com,app.yourserver.com
SESSION_DOMAIN=.yourserver.com
```

---

## 📁 File Structure

```
LARAVEL_SETUP/
├── README.md                          (file ini)
├── INSTALLATION_GUIDE.md              (panduan install step-by-step)
├── FRONTEND_INTEGRATION.md            (contoh integrasi React)
├── 1_create_users_table.php           (migration users)
├── 2_create_pawn_transactions_table.php (migration pawn)
├── 3_create_balance_transactions_table.php (migration balance)
├── 4_create_notifications_table.php   (migration notifications)
├── User.php                           (model User)
├── PawnTransaction.php                (model PawnTransaction)
├── BalanceTransaction.php             (model BalanceTransaction)
├── Notification.php                   (model Notification)
├── AuthController.php                 (auth controller)
├── PawnTransactionController.php      (pawn controller)
├── BalanceTransactionController.php   (balance controller)
├── NotificationController.php         (notification controller)
└── routes_api.php                     (routes configuration)
```

---

## 🚨 Common Issues & Solutions

### Issue: "SQLSTATE[HY000]: General error: 1030"
**Solution:** Database belum ada atau MySQL tidak running
```bash
# Buat database di phpMyAdmin atau via terminal
mysql -u root -e "CREATE DATABASE koperasi_db;"
```

### Issue: "Class not found"
**Solution:** Cache autoload
```bash
composer dump-autoload
php artisan optimize:clear
```

### Issue: CORS Error
**Solution:** Pastikan CORS config di `config/cors.php` sudah benar
```php
'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
'supports_credentials' => true,
```

### Issue: Token tidak valid
**Solution:** Cek di `.env`
```
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173
```

### Issue: "Trying to get property of non-object"
**Solution:** Token expired atau user dihapus
- Delete token di localStorage
- Login ulang

---

## 📚 Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [RESTful API Best Practices](https://restfulapi.net/)

---

## 👨‍💻 Support

Jika ada pertanyaan atau error:
1. Cek INSTALLATION_GUIDE.md
2. Cek FRONTEND_INTEGRATION.md
3. Test di Postman dulu sebelum integrate ke React
4. Lihat error message di `storage/logs/laravel.log`

---

**Last Updated:** January 2024
**Laravel Version:** 11.x
**PHP Version:** 8.1+
**Database:** MySQL 8.0+
