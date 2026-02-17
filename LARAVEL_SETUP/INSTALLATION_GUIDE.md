# 📋 PANDUAN SETUP LARAVEL BACKEND API

## 🚀 STEP 1: Setup Project Laravel

```bash
# Buat project Laravel baru
composer create-project laravel/laravel koperasi-backend

# Masuk ke folder project
cd koperasi-backend

# Install dependency
composer install

# Copy .env.example ke .env
cp .env.example .env

# Generate app key
php artisan key:generate
```

## 🗄️ STEP 2: Setup Database MySQL (Laragon)

### Setup di phpMyAdmin:
1. Buka phpMyAdmin di http://localhost/phpmyadmin
2. Buat database baru dengan nama `koperasi_db`
3. Set charset ke `utf8mb4`

### Setup di .env:
Edit file `.env` di root project Laravel:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=koperasi_db
DB_USERNAME=root
DB_PASSWORD=
```

## 🔐 STEP 3: Setup Sanctum (Authentication)

```bash
# Install Sanctum
composer require laravel/sanctum

# Publish config Sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Setup Sanctum migrations
php artisan migrate
```

Edit `config/sanctum.php` dan pastikan CORS configuration benar:

```php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
    '%s%s',
    'localhost,localhost:3000,localhost:5173',
    env('APP_URL') ? ',' . parse_url(env('APP_URL'), PHP_URL_HOST) : ''
))),
```

Untuk React running di `http://localhost:5173`, pastikan tambahkan ke `.env`:

```env
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:5173
```

## 📁 STEP 4: Copy Models dan Controllers

Copy file-file berikut ke project Laravel Anda:

### Models (copy ke `app/Models/`):
- `User.php`
- `PawnTransaction.php`
- `BalanceTransaction.php`
- `Notification.php`

### Controllers (copy ke `app/Http/Controllers/Api/`):
Buat folder `Api` terlebih dahulu:
```bash
mkdir app/Http/Controllers/Api
```

Kemudian copy:
- `AuthController.php`
- `PawnTransactionController.php`
- `BalanceTransactionController.php`
- `NotificationController.php`

### Routes (replace file `routes/api.php`):
Copy seluruh isi `routes_api.php` ke `routes/api.php`

## 🗂️ STEP 5: Create Migrations

Copy semua file migration ke `database/migrations/`:
- `1_create_users_table.php`
- `2_create_pawn_transactions_table.php`
- `3_create_balance_transactions_table.php`
- `4_create_notifications_table.php`

**PENTING**: Ubah nama file migration dengan format `YYYY_MM_DD_HHMMSS_nama_table.php`
Contoh: `2024_01_15_120000_create_users_table.php`

## ▶️ STEP 6: Run Migrations

```bash
# Jalankan semua migrations
php artisan migrate

# Jika ingin reset database
php artisan migrate:fresh

# Seed data (opsional)
php artisan tinker
>>> User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => Hash::make('password'), 'role' => 'admin', 'status' => 'active'])
```

## 🔄 STEP 7: CORS Configuration

Edit file `config/cors.php`:

```php
'allowed_origins' => ['http://localhost:5173', 'http://localhost:3000'],
'allowed_origins_patterns' => [],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

## 🌐 STEP 8: Run Server Laravel

```bash
# Start development server di port 8000
php artisan serve

# atau custom port
php artisan serve --port=8000
```

Laravel API akan jalan di: `http://127.0.0.1:8000`

---

## 📊 API ENDPOINTS SUMMARY

### 🔓 Public Routes
```
POST /api/register         - Register user baru
POST /api/login            - Login user
```

### 🔒 Protected Routes (memerlukan token)

#### Auth
```
GET  /api/user-profile           - Get profile user yang login
PUT  /api/user-profile           - Update profile user
POST /api/change-password        - Change password
POST /api/logout                 - Logout user
```

#### Pawn Transaction
```
GET    /api/pawn                 - Get semua pengajuan gadai user
POST   /api/pawn                 - Buat pengajuan gadai baru
GET    /api/pawn/{id}            - Get detail gadai
PUT    /api/pawn/{id}            - Update gadai (hanya jika pending)
DELETE /api/pawn/{id}            - Delete gadai (hanya jika pending)
POST   /api/pawn/{id}/approve    - Approve gadai (admin only)
POST   /api/pawn/{id}/reject     - Reject gadai (admin only)
```

#### Balance Transaction
```
GET  /api/balance                - Get history transaksi saldo
POST /api/balance                - Buat transaksi topup/withdraw
GET  /api/balance/{id}           - Get detail transaksi
GET  /api/balance-summary        - Get ringkasan saldo
```

#### Notifications
```
GET /api/notifications                      - Get semua notifikasi
GET /api/notifications/unread-count         - Get jumlah notifikasi belum dibaca
PUT /api/notifications/{id}/read            - Mark notifikasi sebagai dibaca
PUT /api/notifications/mark-all-read        - Mark semua notifikasi sebagai dibaca
DELETE /api/notifications/{id}              - Delete notifikasi
```

---

## ✅ Testing API dengan Postman/Insomnia

### 1. Register
```
POST http://127.0.0.1:8000/api/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "password": "password",
  "password_confirmation": "password"
}
```

### 2. Login
```
POST http://127.0.0.1:8000/api/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password"
}
```
Response akan berisi `token` yang harus disimpan.

### 3. Get User Profile
```
GET http://127.0.0.1:8000/api/user-profile
Authorization: Bearer {TOKEN_DARI_LOGIN}
```

### 4. Create Pawn Transaction
```
POST http://127.0.0.1:8000/api/pawn
Authorization: Bearer {TOKEN}
Content-Type: application/json

{
  "item_name": "Emas 5 Gram",
  "loan_amount": 500000,
  "description": "Gadai emas untuk kebutuhan mendesak"
}
```

---

## 🚨 Troubleshooting

### Error: "SQLSTATE[HY000]: General error: 1030"
Solusi: Pastikan database sudah dibuat di MySQL

### Error: "Class not found"
Solusi: Jalankan `composer dump-autoload` atau `php artisan optimize`

### Error: CORS
Solusi: Pastikan `SANCTUM_STATEFUL_DOMAINS` di `.env` sudah benar

### Error: "Trying to get property of non-object"
Solusi: Pastikan token valid dan user masih ada di database

---

## 📝 Next Steps

1. Setup React frontend dengan Axios (lihat file `FRONTEND_INTEGRATION.md`)
2. Add password reset functionality
3. Add email verification
4. Add rate limiting untuk login attempts
5. Add logging untuk audit trail
