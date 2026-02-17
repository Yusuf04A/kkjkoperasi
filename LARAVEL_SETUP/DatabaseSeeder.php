<?php
// File: database/seeders/DatabaseSeeder.php
// Run: php artisan db:seed

namespace Database\Seeders;

use App\Models\User;
use App\Models\PawnTransaction;
use App\Models\BalanceTransaction;
use App\Models\Notification;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create Admin User
        $admin = User::create([
            'name' => 'Admin Koperasi',
            'email' => 'admin@koperasi.com',
            'phone' => '081234567890',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'status' => 'active',
            'member_id' => 'ADMIN001',
            'tapro_balance' => 100000000, // 100 juta
            'simpok_balance' => 50000000,
            'simwa_balance' => 30000000,
            'avatar_url' => null,
            'email_verified_at' => now(),
        ]);

        // Create Test Users (Members)
        $user1 = User::create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'phone' => '081234567890',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
            'member_id' => 'MBR001',
            'tapro_balance' => 5000000,
            'simpok_balance' => 1000000,
            'simwa_balance' => 500000,
            'avatar_url' => null,
            'email_verified_at' => now(),
        ]);

        $user2 = User::create([
            'name' => 'Siti Nurhaliza',
            'email' => 'siti@example.com',
            'phone' => '082345678901',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
            'member_id' => 'MBR002',
            'tapro_balance' => 3000000,
            'simpok_balance' => 800000,
            'simwa_balance' => 300000,
            'avatar_url' => null,
            'email_verified_at' => now(),
        ]);

        $user3 = User::create([
            'name' => 'Ahmad Wijaya',
            'email' => 'ahmad@example.com',
            'phone' => '083456789012',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'status' => 'active',
            'member_id' => 'MBR003',
            'tapro_balance' => 7500000,
            'simpok_balance' => 1500000,
            'simwa_balance' => 750000,
            'avatar_url' => null,
            'email_verified_at' => now(),
        ]);

        // Create Pawn Transactions
        PawnTransaction::create([
            'user_id' => $user1->id,
            'item_name' => 'Emas 5 Gram',
            'loan_amount' => 500000,
            'description' => 'Gadai untuk kebutuhan mendesak',
            'status' => 'pending',
            'approval_notes' => null,
            'approved_by' => null,
            'approved_at' => null,
        ]);

        PawnTransaction::create([
            'user_id' => $user2->id,
            'item_name' => 'Handphone Samsung A12',
            'loan_amount' => 1000000,
            'description' => 'Gadai hp lama',
            'status' => 'approved',
            'approval_notes' => 'Disetujui',
            'approved_by' => $admin->id,
            'approved_at' => now(),
        ]);

        PawnTransaction::create([
            'user_id' => $user3->id,
            'item_name' => 'Laptop ASUS VivoBook',
            'loan_amount' => 3000000,
            'description' => 'Gadai laptop lama',
            'status' => 'rejected',
            'approval_notes' => 'Barang sudah rusak',
            'approved_by' => $admin->id,
            'approved_at' => now(),
        ]);

        // Create Balance Transactions
        BalanceTransaction::create([
            'user_id' => $user1->id,
            'type' => 'topup',
            'amount' => 1000000,
            'status' => 'success',
            'reference_number' => 'TXN20240115001',
            'payment_method' => 'Bank Transfer',
            'notes' => 'Top up saldo',
        ]);

        BalanceTransaction::create([
            'user_id' => $user2->id,
            'type' => 'withdraw',
            'amount' => 500000,
            'status' => 'success',
            'reference_number' => 'TXN20240115002',
            'payment_method' => 'Cash',
            'notes' => 'Penarikan tunai',
        ]);

        // Create Notifications
        Notification::create([
            'user_id' => $user1->id,
            'title' => 'Pengajuan Gadai Diterima',
            'message' => 'Pengajuan gadai Anda sedang diproses oleh tim kami',
            'type' => 'info',
            'read_at' => null,
        ]);

        Notification::create([
            'user_id' => $user2->id,
            'title' => 'Pengajuan Gadai Disetujui',
            'message' => 'Pengajuan gadai Anda untuk Handphone Samsung A12 telah disetujui',
            'type' => 'success',
            'read_at' => now(),
        ]);

        Notification::create([
            'user_id' => $user3->id,
            'title' => 'Pengajuan Gadai Ditolak',
            'message' => 'Pengajuan gadai Anda telah ditolak. Alasan: Barang sudah rusak',
            'type' => 'warning',
            'read_at' => null,
        ]);

        echo "✅ Database seeding berhasil!\n";
        echo "Admin: admin@koperasi.com / admin123\n";
        echo "User1: budi@example.com / password123\n";
        echo "User2: siti@example.com / password123\n";
        echo "User3: ahmad@example.com / password123\n";
    }
}
