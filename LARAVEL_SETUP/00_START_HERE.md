# 🚀 LARAVEL BACKEND API - START HERE!

Selamat datang! Panduan ini akan membantu Anda menggantikan Supabase dengan Laravel Backend API.

---

## 📌 WHAT IS THIS?

Anda memiliki React aplikasi yang sebelumnya menggunakan Supabase. Sekarang client menginginkan backend diganti dengan **Laravel** dan database **MySQL** (di Laragon).

**Folder `LARAVEL_SETUP` berisi:**
- ✅ Semua kode Laravel siap pakai (Models, Controllers, Routes)
- ✅ Database migrations untuk MySQL
- ✅ Authentication system dengan Laravel Sanctum
- ✅ Dokumentasi lengkap & contoh code
- ✅ Testing script untuk verify semua berjalan

---

## ⚡ QUICK PATH (Pilih salah satu)

### 🏃 "Saya ingin cepat-cepat setup" (15 menit)
**Baca:** [`QUICK_START.md`](./QUICK_START.md)

### 📚 "Saya ingin step-by-step detail" (30 menit)
**Baca:** [`INSTALLATION_GUIDE.md`](./INSTALLATION_GUIDE.md)

### 🎓 "Saya ingin mengerti semuanya" (45 menit)
**Baca:** [`README.md`](./README.md)

### 💻 "Saya siap integrate ke React" (60 menit)
**Baca:** [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md)

### ✅ "Saya ingin checklist" (untuk verify)
**Gunakan:** [`SETUP_CHECKLIST.md`](./SETUP_CHECKLIST.md)

---

## 🎯 YANG AKAN ANDA DAPATKAN

✅ **Backend API** yang fully functional menggantikan Supabase
✅ **Authentication** dengan token-based (Laravel Sanctum)
✅ **Database** design sesuai struktur aplikasi
✅ **CRUD Endpoints** untuk semua fitur (gadai, saldo, notifikasi)
✅ **React Integration** contoh code siap pakai
✅ **Testing Script** untuk verify semua berjalan

---

## 📊 STRUKTUR DATABASE (MYSQL)

```
DATABASE: koperasi_db

TABLES:
├── users (user & member data)
├── pawn_transactions (gadai)
├── balance_transactions (saldo: topup, withdraw)
└── notifications (notifikasi untuk user)
```

---

## 🔌 API ENDPOINTS

```
LOGIN/REGISTER
├── POST   /api/register
└── POST   /api/login

USER (Protected)
├── GET    /api/user-profile
├── PUT    /api/user-profile
├── POST   /api/change-password
└── POST   /api/logout

PAWN TRANSACTIONS (Protected)
├── GET    /api/pawn
├── POST   /api/pawn
├── GET    /api/pawn/{id}
├── PUT    /api/pawn/{id}
└── DELETE /api/pawn/{id}

BALANCE TRANSACTIONS (Protected)
├── GET    /api/balance
├── POST   /api/balance
├── GET    /api/balance/{id}
└── GET    /api/balance-summary

NOTIFICATIONS (Protected)
├── GET    /api/notifications
└── GET    /api/notifications/unread-count
```

---

## 📁 FILE ORGANIZATION

```
LARAVEL_SETUP/
├── 📄 Documentation
│   ├── 00_START_HERE.md              👈 Anda di sini
│   ├── QUICK_START.md                (15 min setup)
│   ├── INSTALLATION_GUIDE.md          (30 min detail)
│   ├── README.md                      (overview)
│   ├── FRONTEND_INTEGRATION.md        (React examples)
│   ├── SETUP_CHECKLIST.md             (verify checklist)
│   └── INDEX.md                       (full index)
│
├── 🗄️ Database (copy ke database/migrations/)
│   ├── 1_create_users_table.php
│   ├── 2_create_pawn_transactions_table.php
│   ├── 3_create_balance_transactions_table.php
│   └── 4_create_notifications_table.php
│
├── 🏗️ Models (copy ke app/Models/)
│   ├── User.php
│   ├── PawnTransaction.php
│   ├── BalanceTransaction.php
│   └── Notification.php
│
├── 🎮 Controllers (copy ke app/Http/Controllers/Api/)
│   ├── AuthController.php
│   ├── PawnTransactionController.php
│   ├── BalanceTransactionController.php
│   └── NotificationController.php
│
├── 🛣️ Routes (copy ke routes/api.php)
│   └── routes_api.php
│
├── ⚙️ Config (copy ke config/)
│   ├── config_cors.php
│   ├── config_sanctum.php
│   └── .env.example
│
├── 🌱 Seeder (copy ke database/seeders/)
│   └── DatabaseSeeder.php
│
└── 🧪 Testing
    └── test-api.js (run: node test-api.js)
```

---

## 🚀 SUPER QUICK START (3 STEPS)

### Step 1: Create Laravel Project
```bash
composer create-project laravel/laravel koperasi-backend
cd koperasi-backend
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### Step 2: Copy All Files
Copy semua file dari folder `LARAVEL_SETUP` sesuai lokasi:
- Migrations → `database/migrations/`
- Models → `app/Models/`
- Controllers → `app/Http/Controllers/Api/`
- Routes → `routes/api.php`
- Config → `config/`
- Seeder → `database/seeders/`

### Step 3: Run Everything
```bash
# Edit .env dengan database credentials
php artisan migrate              # Setup database
php artisan db:seed             # (optional) seed data
php artisan serve               # Start server
```

✅ Backend ready di `http://127.0.0.1:8000/api`

---

## 🧪 TESTING

### Test dengan Script (Recommended)
```bash
node LARAVEL_SETUP/test-api.js
```

### Test dengan Postman
1. Open Postman
2. POST to `http://127.0.0.1:8000/api/login`
3. Email: `budi@example.com`, Password: `password123`
4. Copy token, gunakan di header: `Authorization: Bearer {token}`
5. Test endpoint lainnya

---

## 🔗 INTEGRATE KE REACT

React Anda sudah punya:
- ✅ `src/api/api.ts` - Axios configuration
- ✅ `src/store/useAuthStore.ts` - Zustand store

**Yang perlu updated:**

1. **Login page** (`src/pages/auth/Login.tsx`)
   ```typescript
   const response = await API.post('/login', { email, password });
   const token = response.data.token;
   localStorage.setItem('token', token);
   ```

2. **Register page** (`src/pages/auth/Register.tsx`)
   ```typescript
   const response = await API.post('/register', formData);
   const token = response.data.token;
   localStorage.setItem('token', token);
   ```

3. **Get pawn transactions** (`src/pages/financing/...`)
   ```typescript
   const response = await API.get('/pawn');
   setPawns(response.data.data);
   ```

**Lihat contoh lengkap di:** [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md)

---

## 🆘 COMMON ISSUES & FIX

| Problem | Solution |
|---------|----------|
| "Database not found" | `mysql -u root -e "CREATE DATABASE koperasi_db;"` |
| "SQLSTATE error" | Pastikan MySQL running, database created, credentials di .env benar |
| "Class not found" | `composer dump-autoload && php artisan optimize:clear` |
| "CORS error" | Update `SANCTUM_STATEFUL_DOMAINS` di .env ke `localhost,localhost:5173` |
| "Port already in use" | `php artisan serve --port=8001` |
| "Token invalid" | Delete localStorage, login ulang |

---

## 📚 DOKUMENTASI

| Dokumen | Isinya |
|---------|--------|
| `QUICK_START.md` | 15 menit setup guide |
| `INSTALLATION_GUIDE.md` | Detail step-by-step setup |
| `README.md` | Overview, database schema, API endpoints |
| `FRONTEND_INTEGRATION.md` | React integration examples & best practices |
| `INDEX.md` | Full index dari semua file & resources |
| `SETUP_CHECKLIST.md` | Checklist untuk verify semuanya done |

**Baca sesuai kebutuhan Anda!**

---

## 🎯 NEXT STEPS

1. **Setup Backend** (Follow QUICK_START.md)
   - Create Laravel project
   - Copy files
   - Run migrations
   - Start server

2. **Test Backend** (Using test-api.js or Postman)
   - Test login/register
   - Test pawn endpoints
   - Test balance endpoints
   - Test notifications

3. **Integrate React** (Follow FRONTEND_INTEGRATION.md)
   - Update login/register pages
   - Update CRUD pages
   - Test end-to-end
   - Deploy

---

## ✅ HOW TO USE THIS FOLDER

### Scenario 1: "Baru pertama kali, mau cepat selesai"
1. Baca `QUICK_START.md`
2. Copy all files as instructed
3. Run commands
4. Done! ✅

### Scenario 2: "Mau mengerti semuanya dulu"
1. Baca `README.md` untuk overview
2. Baca `INSTALLATION_GUIDE.md` untuk detail
3. Baca `FRONTEND_INTEGRATION.md` untuk contoh
4. Copy files dengan percaya diri

### Scenario 3: "Saya sudah setup, mau verify"
1. Gunakan `SETUP_CHECKLIST.md`
2. Centang setiap langkah
3. Run `test-api.js` untuk verify

### Scenario 4: "Ada error, gimana?"
1. Cek `README.md` troubleshooting section
2. Cek error di `storage/logs/laravel.log`
3. Test di Postman dulu sebelum suspect React

---

## 💡 KEY CONCEPTS

### Laravel Sanctum (Authentication)
User login → Server return **Bearer Token** → React simpan di localStorage → Setiap request append header `Authorization: Bearer {token}`

### Database Design
Tabel-tabel dirancang untuk support:
- User registration & login
- Pawn transaction (gadai) request & approval
- Balance transaction (topup/withdraw)
- Notifications untuk user

### API Response Format
```json
{
  "message": "Success message",
  "data": { /* actual data */ },
  "errors": { /* validation errors */ }
}
```

---

## 📞 SUPPORT

Jika ada pertanyaan:
1. **Cek dokumentasi** yang sesuai
2. **Test di Postman** sebelum React
3. **Lihat error** di `storage/logs/laravel.log`
4. **Check .env** configuration

---

## 🎉 YOU'RE READY!

Sekarang Anda siap untuk:
- ✅ Build Laravel Backend API yang menggantikan Supabase
- ✅ Setup MySQL database dengan design yang proper
- ✅ Implement authentication dengan token
- ✅ Integrate React frontend dengan Laravel backend
- ✅ Deploy ke production

---

## 📖 PILIH DOKUMENTASI YANG SESUAI KEBUTUHAN

```
├─ "Cepat setup" (15 min)
│  └─> Baca: QUICK_START.md
│
├─ "Detail & lengkap" (45 min)
│  └─> Baca: INSTALLATION_GUIDE.md → README.md
│
├─ "Integrate React" (60 min)
│  └─> Baca: FRONTEND_INTEGRATION.md
│
├─ "Verify & checklist"
│  └─> Gunakan: SETUP_CHECKLIST.md
│
└─ "Full index"
   └─> Lihat: INDEX.md
```

---

**Siap mulai? Pilih dokumentasi di atas dan mulai!** 🚀

---

*Last Updated: January 2024*
*Laravel 11.x | PHP 8.1+ | MySQL 8.0+*
