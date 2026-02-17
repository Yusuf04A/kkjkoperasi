# ✅ LARAVEL BACKEND SETUP CHECKLIST

Gunakan checklist ini untuk memastikan semua langkah setup sudah dilakukan dengan benar.

---

## PHASE 1: INITIAL SETUP (Laravel & Database)

### A. Create Laravel Project
- [ ] Buat project Laravel: `composer create-project laravel/laravel koperasi-backend`
- [ ] Masuk folder: `cd koperasi-backend`
- [ ] Install dependencies: `composer install`
- [ ] Generate app key: `php artisan key:generate`

### B. Setup Sanctum (Authentication)
- [ ] Install Sanctum: `composer require laravel/sanctum`
- [ ] Publish Sanctum: `php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"`
- [ ] Check: file `config/sanctum.php` sudah ada

### C. Setup Database
- [ ] Buat database MySQL: `mysql -u root -e "CREATE DATABASE koperasi_db;"`
- [ ] Edit `.env`:
  - [ ] `DB_DATABASE=koperasi_db`
  - [ ] `DB_USERNAME=root`
  - [ ] `DB_PASSWORD=` (kosong jika default Laragon)
  - [ ] `SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173,localhost:3000`

---

## PHASE 2: COPY FILES & CONFIGURATION

### A. Copy Migration Files
Ke folder `database/migrations/` (UBAH NAMA dengan format timestamp):

- [ ] `1_create_users_table.php` → `2024_01_15_100000_create_users_table.php`
- [ ] `2_create_pawn_transactions_table.php` → `2024_01_15_100001_create_pawn_transactions_table.php`
- [ ] `3_create_balance_transactions_table.php` → `2024_01_15_100002_create_balance_transactions_table.php`
- [ ] `4_create_notifications_table.php` → `2024_01_15_100003_create_notifications_table.php`

### B. Copy Model Files
Ke folder `app/Models/`:

- [ ] `User.php`
- [ ] `PawnTransaction.php`
- [ ] `BalanceTransaction.php`
- [ ] `Notification.php`

### C. Copy Controller Files
Ke folder `app/Http/Controllers/Api/` (create folder dulu):

```bash
mkdir app/Http/Controllers/Api
```

- [ ] `AuthController.php`
- [ ] `PawnTransactionController.php`
- [ ] `BalanceTransactionController.php`
- [ ] `NotificationController.php`

### D. Copy Routes File
- [ ] Replace semua isi `routes/api.php` dengan isi `routes_api.php`
- [ ] Verify: Routes file sudah benar dengan endpoint yang lengkap

### E. Copy Configuration Files
- [ ] Copy `config_cors.php` → `config/cors.php`
- [ ] Copy `config_sanctum.php` → `config/sanctum.php`

### F. Copy Seeder File
- [ ] Copy `DatabaseSeeder.php` → `database/seeders/DatabaseSeeder.php`

---

## PHASE 3: DATABASE MIGRATIONS

- [ ] Run migrations: `php artisan migrate`
- [ ] Verify: Lihat di phpMyAdmin apakah semua tables sudah dibuat
  - [ ] `users` table ada
  - [ ] `pawn_transactions` table ada
  - [ ] `balance_transactions` table ada
  - [ ] `notifications` table ada

---

## PHASE 4: SEED DATA (OPSIONAL)

- [ ] Run seeder: `php artisan db:seed`
- [ ] Verify di phpMyAdmin:
  - [ ] `users` table punya 4 test users
  - [ ] `pawn_transactions` table punya sample data
  - [ ] `balance_transactions` table punya sample data
  - [ ] `notifications` table punya sample data

**Test User Credentials:**
- Admin: `admin@koperasi.com` / `admin123`
- User1: `budi@example.com` / `password123`
- User2: `siti@example.com` / `password123`
- User3: `ahmad@example.com` / `password123`

---

## PHASE 5: TESTING BACKEND

### A. Start Laravel Server
- [ ] Run: `php artisan serve`
- [ ] Check: Server berjalan di `http://127.0.0.1:8000`

### B. Testing dengan Script Node.js
- [ ] Install Node.js (jika belum)
- [ ] Run: `node LARAVEL_SETUP/test-api.js`
- [ ] Verify: Semua test endpoint menunjukkan ✅

Atau testing manual dengan Postman:

### C. Testing dengan Postman

#### Test 1: Login
- [ ] POST `http://127.0.0.1:8000/api/login`
- [ ] Body: `{"email": "budi@example.com", "password": "password123"}`
- [ ] Response: Harus ada `token` dan `user` data
- [ ] Copy token untuk test berikutnya

#### Test 2: Get Profile (Protected)
- [ ] GET `http://127.0.0.1:8000/api/user-profile`
- [ ] Header: `Authorization: Bearer {TOKEN_DARI_LOGIN}`
- [ ] Response: Harus menampilkan user profile data

#### Test 3: Create Pawn Transaction
- [ ] POST `http://127.0.0.1:8000/api/pawn`
- [ ] Header: `Authorization: Bearer {TOKEN}`
- [ ] Body: `{"item_name": "Emas", "loan_amount": 500000}`
- [ ] Response: Harus menampilkan transaction baru dengan status "pending"

#### Test 4: Get Pawn Transactions
- [ ] GET `http://127.0.0.1:8000/api/pawn`
- [ ] Header: `Authorization: Bearer {TOKEN}`
- [ ] Response: Harus menampilkan array dari pawn transactions

#### Test 5: Create Balance Transaction
- [ ] POST `http://127.0.0.1:8000/api/balance`
- [ ] Header: `Authorization: Bearer {TOKEN}`
- [ ] Body: `{"type": "topup", "amount": 500000}`
- [ ] Response: Harus menampilkan transaction baru dengan status "success"

#### Test 6: Get Notifications
- [ ] GET `http://127.0.0.1:8000/api/notifications`
- [ ] Header: `Authorization: Bearer {TOKEN}`
- [ ] Response: Harus menampilkan array dari notifications

#### Test 7: Logout
- [ ] POST `http://127.0.0.1:8000/api/logout`
- [ ] Header: `Authorization: Bearer {TOKEN}`
- [ ] Response: Harus menampilkan message "Logout berhasil"

---

## PHASE 6: FRONTEND INTEGRATION

### A. Verify API Client Configuration
- [ ] File `src/api/api.ts` sudah ada
- [ ] Base URL: `http://127.0.0.1:8000/api`
- [ ] Interceptor untuk Bearer token sudah ada
- [ ] CORS handling sudah ada

### B. Update Auth Store
- [ ] File `src/store/useAuthStore.ts` sudah updated
- [ ] Method `setAuth` menyimpan token ke localStorage
- [ ] Method `logout` menghapus token
- [ ] Method `checkSession` memanggil `/user-profile`

### C. Update Login Page
- [ ] `src/pages/auth/Login.tsx` call API `/api/login`
- [ ] Simpan token ke localStorage setelah login
- [ ] Redirect ke dashboard setelah login sukses
- [ ] Handle error dengan baik

### D. Update Register Page
- [ ] `src/pages/auth/Register.tsx` call API `/api/register`
- [ ] Simpan token ke localStorage setelah register
- [ ] Redirect ke dashboard
- [ ] Validation error ditampilkan dengan baik

### E. Test React Integration
- [ ] Start React dev server: `npm run dev` atau `yarn dev`
- [ ] React running di `http://localhost:5173`
- [ ] Test login dengan email & password dari seeder
- [ ] Token tersimpan di localStorage
- [ ] API calls dari React berhasil

---

## PHASE 7: VERIFY EVERYTHING WORKS

### Backend
- [ ] `php artisan serve` berjalan tanpa error
- [ ] Semua migration selesai
- [ ] Database punya test data
- [ ] Test script (`test-api.js`) semua passing ✅

### Frontend
- [ ] React dev server berjalan di localhost:5173
- [ ] Login page bisa connect ke backend
- [ ] Token disimpan di localStorage setelah login
- [ ] API calls dari React successful
- [ ] User profile page menampilkan data dari API

### Integration
- [ ] React ↔ Laravel API komunikasi lancar
- [ ] Token refresh/expiry handling berjalan
- [ ] CORS tidak ada error
- [ ] Logout menghapus token dan redirect ke login

---

## PHASE 8: FINAL CHECKS

- [ ] Laravel running di port 8000
- [ ] React running di port 5173
- [ ] Database `koperasi_db` ada dengan semua tables
- [ ] All migrations selesai
- [ ] Test data sudah ada (optional)
- [ ] Login/Register berfungsi
- [ ] Protected routes require token
- [ ] Error handling berjalan baik
- [ ] Documentation lengkap

---

## 🎉 READY FOR PRODUCTION?

Sebelum deploy:

- [ ] Update `.env` dengan production credentials
- [ ] Change `APP_DEBUG=false` di production
- [ ] Setup HTTPS
- [ ] Update `CORS_ALLOWED_ORIGINS` dengan domain production
- [ ] Update `SANCTUM_STATEFUL_DOMAINS` dengan domain production
- [ ] Setup proper logging
- [ ] Setup database backup
- [ ] Test semua scenario
- [ ] Setup monitoring/error tracking

---

## 📞 TROUBLESHOOTING

Jika ada error pada tahap tertentu:

| Error | Solusi | Phase |
|-------|--------|-------|
| "Class not found" | `composer dump-autoload && php artisan optimize:clear` | 2-3 |
| "Database not found" | `mysql -u root -e "CREATE DATABASE koperasi_db;"` | 1 |
| "Port 8000 already in use" | `php artisan serve --port=8001` | 5 |
| "CORS error" | Update `.env` SANCTUM config | 6 |
| "401 Unauthorized" | Check token di header, pastikan ada "Bearer " prefix | 5-6 |
| "Connection refused" | Pastikan Laravel server sudah running | 5 |

---

## 📋 COMPLETED? 

Jika semua checklist sudah diisi ✅, maka:

✅ Backend Laravel API siap pakai
✅ Database MySQL sesuai design
✅ Authentication dengan Sanctum berfungsi
✅ Frontend React terintegrasi dengan baik
✅ Ready untuk production deployment

---

**Happy coding! 🚀**

Untuk detail lebih lanjut, baca:
- `QUICK_START.md` - Setup cepat
- `INSTALLATION_GUIDE.md` - Panduan lengkap
- `FRONTEND_INTEGRATION.md` - Contoh code React
