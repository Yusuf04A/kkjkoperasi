# 📋 LARAVEL_SETUP FOLDER - COMPLETE FILE MANIFEST

Daftar lengkap semua file yang ada di folder `LARAVEL_SETUP` dan cara menggunakannya.

---

## 📚 DOCUMENTATION FILES (8 files)

### 1. `00_START_HERE.md` ⭐ START HERE!
**Tujuan:** Entry point utama, guide pengguna memilih path mana yang cocok
**Dibaca Pertama Kali:** YA!
**Waktu Baca:** 5 menit
**Isi:** Overview, quick start, key concepts, scenario-based guide

### 2. `QUICK_START.md` ⚡ SUPER CEPAT
**Tujuan:** Setup Laravel dalam 15 menit
**Untuk Siapa:** Yang ingin langsung praktik tanpa banyak penjelasan
**Waktu:** 15 menit
**Isi:** 6 langkah setup cepat, checklist, troubleshooting ringkas

### 3. `INSTALLATION_GUIDE.md` 📚 DETAIL PENUH
**Tujuan:** Setup step-by-step dengan penjelasan
**Untuk Siapa:** Yang ingin mengerti setiap langkah
**Waktu:** 30 menit
**Isi:** Setup Laravel, Sanctum, database, testing dengan Postman

### 4. `README.md` 🎓 OVERVIEW LENGKAP
**Tujuan:** Overview keseluruhan project & architecture
**Untuk Siapa:** Yang ingin memahami big picture
**Waktu:** 45 menit
**Isi:** Database schema, API overview, models, controllers, deployment guide

### 5. `FRONTEND_INTEGRATION.md` 💻 REACT EXAMPLES
**Tujuan:** Contoh kode React integration dengan Laravel
**Untuk Siapa:** Developer frontend yang integrate ke backend
**Waktu:** 60 menit
**Isi:** Axios setup, login/register, CRUD examples, error handling

### 6. `INDEX.md` 🗂️ FULL INDEX
**Tujuan:** Index lengkap semua file & resources
**Untuk Siapa:** Navigation & reference
**Waktu:** Quick reference
**Isi:** Daftar semua file, endpoints, examples, resources

### 7. `SETUP_CHECKLIST.md` ✅ VERIFY CHECKLIST
**Tujuan:** Checklist untuk verify semua setup benar
**Untuk Siapa:** Saat atau setelah setup selesai
**Waktu:** Check each phase
**Isi:** 8 phase checklist, phase per phase verification

### 8. `FILES_MANIFEST.md` 📋 INI FILE!
**Tujuan:** Daftar lengkap semua file & penjelasan
**Untuk Siapa:** Understanding struktur folder
**Waktu:** Reference
**Isi:** Daftar semua file dengan keterangan

---

## 🗄️ DATABASE MIGRATION FILES (4 files)

### 1. `1_create_users_table.php`
**Copy To:** `database/migrations/` (rename to `2024_01_15_100000_create_users_table.php`)
**Isi:** Tabel users dengan fields: id, name, email, password, role, status, member_id, tapro_balance, simpok_balance, simwa_balance, avatar_url
**Relations:** Has many pawn_transactions, balance_transactions, notifications

### 2. `2_create_pawn_transactions_table.php`
**Copy To:** `database/migrations/` (rename to `2024_01_15_100001_create_pawn_transactions_table.php`)
**Isi:** Tabel pawn_transactions dengan fields: id, user_id, item_name, loan_amount, description, status, approval_notes, approved_by, approved_at
**Relations:** Belongs to User (pemilik), Belongs to User (approver)

### 3. `3_create_balance_transactions_table.php`
**Copy To:** `database/migrations/` (rename to `2024_01_15_100002_create_balance_transactions_table.php`)
**Isi:** Tabel balance_transactions dengan fields: id, user_id, type, amount, status, reference_number, payment_method, notes
**Relations:** Belongs to User

### 4. `4_create_notifications_table.php`
**Copy To:** `database/migrations/` (rename to `2024_01_15_100003_create_notifications_table.php`)
**Isi:** Tabel notifications dengan fields: id, user_id, title, message, type, read_at
**Relations:** Belongs to User

---

## 🏗️ MODEL FILES (4 files)

### 1. `User.php`
**Copy To:** `app/Models/User.php`
**Isi:** Model User dengan:
- Fillable fields: name, email, phone, password, role, status, member_id, tapro_balance, simpok_balance, simwa_balance, avatar_url
- Relations: hasMany pawnTransactions, hasMany balanceTransactions, hasMany notifications
- Scopes: active(), members()
- Extends: Authenticatable, HasApiTokens, Notifiable

### 2. `PawnTransaction.php`
**Copy To:** `app/Models/PawnTransaction.php`
**Isi:** Model PawnTransaction dengan:
- Fillable fields: user_id, item_name, loan_amount, description, status, approval_notes, approved_by, approved_at
- Relations: belongsTo User (user), belongsTo User (approver)
- Scopes: pending(), approved()

### 3. `BalanceTransaction.php`
**Copy To:** `app/Models/BalanceTransaction.php`
**Isi:** Model BalanceTransaction dengan:
- Fillable fields: user_id, type, amount, status, reference_number, payment_method, notes
- Relations: belongsTo User
- Scopes: success(), topup()

### 4. `Notification.php`
**Copy To:** `app/Models/Notification.php`
**Isi:** Model Notification dengan:
- Fillable fields: user_id, title, message, type, read_at
- Relations: belongsTo User
- Scopes: unread()
- Methods: markAsRead()

---

## 🎮 CONTROLLER FILES (4 files)

### 1. `AuthController.php` (223 lines)
**Copy To:** `app/Http/Controllers/Api/AuthController.php`
**Methods:**
- `register()` - POST /api/register - Register user baru
- `login()` - POST /api/login - Login user
- `logout()` - POST /api/logout - Logout (protected)
- `profile()` - GET /api/user-profile - Get profile (protected)
- `updateProfile()` - PUT /api/user-profile - Update profile (protected)
- `changePassword()` - POST /api/change-password - Change password (protected)

### 2. `PawnTransactionController.php` (275 lines)
**Copy To:** `app/Http/Controllers/Api/PawnTransactionController.php`
**Methods:**
- `index()` - GET /api/pawn - List user's pawn transactions
- `store()` - POST /api/pawn - Create new pawn transaction
- `show()` - GET /api/pawn/{id} - Get pawn detail
- `update()` - PUT /api/pawn/{id} - Update pawn (only if pending)
- `destroy()` - DELETE /api/pawn/{id} - Delete pawn (only if pending)
- `approve()` - POST /api/pawn/{id}/approve - Approve pawn (admin only)
- `reject()` - POST /api/pawn/{id}/reject - Reject pawn (admin only)

### 3. `BalanceTransactionController.php` (164 lines)
**Copy To:** `app/Http/Controllers/Api/BalanceTransactionController.php`
**Methods:**
- `index()` - GET /api/balance - Get balance transaction history
- `store()` - POST /api/balance - Create topup/withdraw transaction
- `show()` - GET /api/balance/{id} - Get balance transaction detail
- `summary()` - GET /api/balance-summary - Get balance summary

### 4. `NotificationController.php` (133 lines)
**Copy To:** `app/Http/Controllers/Api/NotificationController.php`
**Methods:**
- `index()` - GET /api/notifications - Get all notifications
- `unreadCount()` - GET /api/notifications/unread-count - Count unread
- `markAsRead()` - PUT /api/notifications/{id}/read - Mark as read
- `markAllAsRead()` - PUT /api/notifications/mark-all-read - Mark all as read
- `destroy()` - DELETE /api/notifications/{id} - Delete notification

---

## 🛣️ ROUTE FILES (1 file)

### `routes_api.php` (67 lines)
**Copy To:** `routes/api.php` (replace entire file)
**Contains:**
- Public routes: register, login
- Protected routes (middleware 'auth:sanctum'):
  - Auth: logout, profile, updateProfile, changePassword
  - Pawn: index, store, show, update, delete, approve, reject
  - Balance: index, store, show, summary
  - Notifications: index, unreadCount, markAsRead, markAllAsRead, destroy
- Fallback for undefined routes

---

## ⚙️ CONFIG FILES (3 files)

### 1. `config_cors.php`
**Copy To:** `config/cors.php`
**Isi:**
- allowed_origins: localhost:5173, localhost:3000, 127.0.0.1
- allowed_methods: '*'
- allowed_headers: '*'
- supports_credentials: true
- exposed_headers: Authorization, X-Total-Count

### 2. `config_sanctum.php`
**Copy To:** `config/sanctum.php`
**Isi:**
- stateful domains configuration
- CSRF token middleware
- Session configuration
- Expiration settings

### 3. `.env.example`
**Copy To:** `.env` (edit sesuai kebutuhan)
**Contains:**
- APP_NAME, APP_ENV, APP_DEBUG, APP_URL
- DB_CONNECTION, DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
- SANCTUM_STATEFUL_DOMAINS, SESSION_DOMAIN, CORS_ALLOWED_ORIGINS
- Default values untuk environment variables

---

## 🌱 SEEDER FILES (1 file)

### `DatabaseSeeder.php` (170 lines)
**Copy To:** `database/seeders/DatabaseSeeder.php`
**Isi:**
- Creates 1 admin user: admin@koperasi.com / admin123
- Creates 3 member users:
  - budi@example.com / password123
  - siti@example.com / password123
  - ahmad@example.com / password123
- Creates sample pawn transactions (pending, approved, rejected)
- Creates sample balance transactions
- Creates sample notifications

**Run dengan:** `php artisan db:seed`

---

## 🧪 TESTING FILES (1 file)

### `test-api.js` (348 lines)
**Location:** Tetap di LARAVEL_SETUP/ atau copy ke root project
**Run dengan:** `node test-api.js`
**Tests:**
1. Register (membuat user baru)
2. Login (authenticate)
3. Get Profile (protected)
4. Update Profile (protected)
5. Create Pawn Transaction
6. Get Pawn Transactions
7. Get Pawn Detail
8. Create Balance Transaction
9. Get Balance Transactions
10. Get Balance Summary
11. Get Notifications
12. Get Unread Count
13. Change Password
14. Logout

---

## 📊 SUMMARY - TOTAL FILES

### By Category
- **Documentation:** 8 files
- **Migrations:** 4 files
- **Models:** 4 files
- **Controllers:** 4 files
- **Routes:** 1 file
- **Config:** 3 files
- **Seeder:** 1 file
- **Testing:** 1 file
- **Total:** 26 files

### By Purpose
- **Read/Learn:** 8 files (docs)
- **Copy to Laravel:** 17 files (migrations, models, controllers, routes, config, seeder)
- **Run/Execute:** 1 file (test-api.js)

---

## 📥 HOW TO USE THESE FILES

### Step 1: Create Laravel Project
```bash
composer create-project laravel/laravel koperasi-backend
cd koperasi-backend
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
```

### Step 2: Copy Database Files
Copy semua file `.php` dari LARAVEL_SETUP ke:
```
database/migrations/
(rename dengan format: YYYY_MM_DD_HHMMSS_nama.php)
```

### Step 3: Copy Model Files
Copy 4 model files ke:
```
app/Models/
```

### Step 4: Copy Controller Files
Buat folder dulu:
```bash
mkdir app/Http/Controllers/Api
```
Copy 4 controller files ke folder tersebut.

### Step 5: Copy Route File
Copy isi `routes_api.php` ke `routes/api.php`

### Step 6: Copy Config Files
```
config_cors.php → config/cors.php
config_sanctum.php → config/sanctum.php
```

### Step 7: Edit .env
Copy `.env.example` atau edit `.env` yang sudah ada:
```
DB_DATABASE=koperasi_db
DB_USERNAME=root
DB_PASSWORD=
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173
```

### Step 8: Copy Seeder (Optional)
Copy `DatabaseSeeder.php` ke `database/seeders/`

### Step 9: Run Everything
```bash
php artisan migrate
php artisan db:seed (optional)
php artisan serve
```

### Step 10: Test
```bash
node test-api.js
```

---

## 🎯 READING ORDER

1. **First:** `00_START_HERE.md` (ini dulu!)
2. **Then:** Choose path:
   - Quick: `QUICK_START.md`
   - Detail: `INSTALLATION_GUIDE.md`
   - Overview: `README.md`
   - React: `FRONTEND_INTEGRATION.md`
3. **For Reference:** `INDEX.md`
4. **For Verification:** `SETUP_CHECKLIST.md`
5. **For Understanding Structure:** `FILES_MANIFEST.md` (ini file)

---

## ✅ VERIFICATION

Setelah copy semua files, verify:
- [ ] 4 migration files di `database/migrations/` dengan nama format timestamp
- [ ] 4 model files di `app/Models/`
- [ ] 4 controller files di `app/Http/Controllers/Api/`
- [ ] Routes di `routes/api.php`
- [ ] Config di `config/`
- [ ] Seeder di `database/seeders/`
- [ ] .env updated dengan DB credentials

---

## 📞 QUICK REFERENCE

**Need to...**
- Setup quick? → QUICK_START.md
- Understand details? → INSTALLATION_GUIDE.md
- Learn whole architecture? → README.md
- Integrate with React? → FRONTEND_INTEGRATION.md
- Find something? → INDEX.md
- Verify all done? → SETUP_CHECKLIST.md

---

**Total Lines of Code:** ~2,000+ lines of production-ready code!

*Last Updated: January 2024*
