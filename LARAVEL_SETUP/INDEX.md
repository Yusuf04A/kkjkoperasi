# 📚 LARAVEL BACKEND API - DOKUMENTASI LENGKAP

Dokumentasi komprehensif untuk menggantikan Supabase dengan Laravel API + MySQL.

---

## 🗂️ DAFTAR FILE & DOKUMENTASI

### 📖 Dokumentasi Utama

| File | Deskripsi | Untuk Siapa |
|------|-----------|-----------|
| **QUICK_START.md** | Setup dalam 15 menit | Ingin cepat-cepat setup |
| **INSTALLATION_GUIDE.md** | Panduan step-by-step detail | Ingin mengerti setiap langkah |
| **README.md** | Overview & struktur database | Ingin memahami whole picture |
| **FRONTEND_INTEGRATION.md** | Contoh code React integration | Developer frontend |

### 💾 DATABASE FILES

| File | Lokasi Tujuan | Deskripsi |
|------|--------------|----------|
| `1_create_users_table.php` | `database/migrations/` | Tabel users |
| `2_create_pawn_transactions_table.php` | `database/migrations/` | Tabel gadai |
| `3_create_balance_transactions_table.php` | `database/migrations/` | Tabel transaksi saldo |
| `4_create_notifications_table.php` | `database/migrations/` | Tabel notifikasi |

### 🏗️ MODEL FILES

| File | Lokasi Tujuan | Deskripsi |
|------|--------------|----------|
| `User.php` | `app/Models/` | Model User dengan relations |
| `PawnTransaction.php` | `app/Models/` | Model gadai |
| `BalanceTransaction.php` | `app/Models/` | Model transaksi saldo |
| `Notification.php` | `app/Models/` | Model notifikasi |

### 🎮 CONTROLLER FILES

| File | Lokasi Tujuan | Deskripsi |
|------|--------------|----------|
| `AuthController.php` | `app/Http/Controllers/Api/` | Auth logic (login, register, etc) |
| `PawnTransactionController.php` | `app/Http/Controllers/Api/` | CRUD gadai + approve/reject |
| `BalanceTransactionController.php` | `app/Http/Controllers/Api/` | CRUD transaksi saldo |
| `NotificationController.php` | `app/Http/Controllers/Api/` | CRUD notifikasi |

### 🛣️ ROUTE FILES

| File | Lokasi Tujuan | Deskripsi |
|------|--------------|----------|
| `routes_api.php` | `routes/api.php` | Semua API endpoints |

### ⚙️ CONFIG FILES

| File | Lokasi Tujuan | Deskripsi |
|------|--------------|----------|
| `config_cors.php` | `config/cors.php` | CORS configuration |
| `config_sanctum.php` | `config/sanctum.php` | Sanctum auth config |
| `.env.example` | `.env` | Environment variables |

### 🌱 SEEDER FILES

| File | Lokasi Tujuan | Deskripsi |
|------|--------------|----------|
| `DatabaseSeeder.php` | `database/seeders/` | Test data (opsional) |

### 🧪 TESTING FILES

| File | Cara Jalankan | Deskripsi |
|------|--------------|----------|
| `test-api.js` | `node test-api.js` | Testing semua endpoints |

---

## 🚀 STARTING GUIDE

### Pilihan 1: Super Cepat (15 menit) ⚡
👉 **Baca:** `QUICK_START.md`

### Pilihan 2: Detail Step-by-Step (30 menit) 📝
👉 **Baca:** `INSTALLATION_GUIDE.md`

### Pilihan 3: Ingin Mengerti Semuanya (45 menit) 🎓
👉 **Baca:** `README.md`

### Pilihan 4: Integrate ke React (60 menit) 💻
👉 **Baca:** `FRONTEND_INTEGRATION.md`

---

## 📋 DATABASE SCHEMA OVERVIEW

### Tabel Users
```sql
id, name, email, phone, password, role, status, 
member_id, tapro_balance, simpok_balance, simwa_balance, 
avatar_url, email_verified_at, created_at, updated_at
```

### Tabel Pawn Transactions
```sql
id, user_id, item_name, loan_amount, description, 
status, approval_notes, approved_by, approved_at, 
created_at, updated_at
```

### Tabel Balance Transactions
```sql
id, user_id, type, amount, status, reference_number, 
payment_method, notes, created_at, updated_at
```

### Tabel Notifications
```sql
id, user_id, title, message, type, read_at, 
created_at, updated_at
```

---

## 🔌 API ENDPOINTS SUMMARY

```
PUBLIC ROUTES
├── POST   /api/register
└── POST   /api/login

PROTECTED ROUTES (perlu Bearer token)
├── AUTH
│   ├── POST   /api/logout
│   ├── GET    /api/user-profile
│   ├── PUT    /api/user-profile
│   └── POST   /api/change-password
│
├── PAWN TRANSACTIONS
│   ├── GET    /api/pawn
│   ├── POST   /api/pawn
│   ├── GET    /api/pawn/{id}
│   ├── PUT    /api/pawn/{id}
│   ├── DELETE /api/pawn/{id}
│   ├── POST   /api/pawn/{id}/approve (admin)
│   └── POST   /api/pawn/{id}/reject (admin)
│
├── BALANCE TRANSACTIONS
│   ├── GET    /api/balance
│   ├── POST   /api/balance
│   ├── GET    /api/balance/{id}
│   └── GET    /api/balance-summary
│
└── NOTIFICATIONS
    ├── GET    /api/notifications
    ├── GET    /api/notifications/unread-count
    ├── PUT    /api/notifications/{id}/read
    ├── PUT    /api/notifications/mark-all-read
    └── DELETE /api/notifications/{id}
```

---

## 🎯 QUICK CHECKLIST

### Setup Awal (Copy Files)
- [ ] Copy migrations ke `database/migrations/`
- [ ] Copy models ke `app/Models/`
- [ ] Copy controllers ke `app/Http/Controllers/Api/`
- [ ] Copy routes ke `routes/api.php`
- [ ] Copy config ke `config/`
- [ ] Copy seeder ke `database/seeders/`

### Konfigurasi
- [ ] Update `.env` dengan database credentials
- [ ] Set `SANCTUM_STATEFUL_DOMAINS` di `.env`
- [ ] Run `composer require laravel/sanctum`
- [ ] Run `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`

### Database
- [ ] Create database `koperasi_db`
- [ ] Run `php artisan migrate`
- [ ] Run `php artisan db:seed` (opsional)

### Testing
- [ ] Start Laravel: `php artisan serve`
- [ ] Test dengan Postman atau: `node test-api.js`
- [ ] Setup React integration

---

## 📊 REQUEST/RESPONSE EXAMPLES

### Login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login berhasil",
  "user": { ... },
  "token": "1|BfKTF3nYIZhvTJYqaBoUKWGYYcHcXYZWqJ9nR7Mq"
}
```

### Create Pawn
**Request:**
```json
{
  "item_name": "Emas 5 Gram",
  "loan_amount": 500000,
  "description": "Gadai untuk kebutuhan mendesak"
}
```

**Response:**
```json
{
  "message": "Pengajuan gadai berhasil dibuat",
  "data": {
    "id": 1,
    "user_id": 1,
    "item_name": "Emas 5 Gram",
    "loan_amount": 500000,
    "status": "pending",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🆘 COMMON ISSUES

| Masalah | Solusi |
|---------|--------|
| Database not found | `mysql -u root -e "CREATE DATABASE koperasi_db;"` |
| Class not found | `composer dump-autoload && php artisan optimize:clear` |
| CORS error | Pastikan `SANCTUM_STATEFUL_DOMAINS` di .env |
| Token tidak valid | Delete localStorage, login ulang |
| 401 Unauthorized | Token expired, pastikan header `Authorization: Bearer {token}` |
| 422 Validation error | Cek data yang dikirim, baca error message |

---

## 📚 EXTERNAL RESOURCES

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Axios Documentation](https://axios-http.com/)
- [RESTful API Best Practices](https://restfulapi.net/)

---

## 🤝 SUPPORT

Jika ada pertanyaan:
1. Cek dokumentasi yang sesuai
2. Test dengan Postman/test-api.js
3. Lihat error di `storage/logs/laravel.log`
4. Cek `.env` configuration

---

## 📈 NEXT STEPS SETELAH SETUP

1. ✅ Backend Laravel running
2. ✅ Database seeded dengan data test
3. ✅ API tested dengan Postman/test-api.js
4. → **NEXT:** Integrate dengan React frontend
5. → Update login/register page
6. → Update CRUD components untuk pawn/balance
7. → Test end-to-end di browser
8. → Deploy ke production

---

**Made with ❤️ for KKJ Cooperative**

Last Updated: January 2024
Laravel Version: 11.x | PHP: 8.1+ | MySQL: 8.0+
