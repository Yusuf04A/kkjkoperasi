<?php
// File: database/migrations/[timestamp]_create_users_table.php
// Copy paste ke Laravel project Anda dan jalankan: php artisan migrate

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('password');
            $table->enum('role', ['member', 'admin', 'operator'])->default('member');
            $table->enum('status', ['active', 'inactive', 'suspended'])->default('active');
            $table->string('member_id')->nullable()->unique();
            $table->decimal('tapro_balance', 15, 2)->default(0); // Saldo Tapro
            $table->decimal('simpok_balance', 15, 2)->default(0); // Saldo Simpanan Wajib
            $table->decimal('simwa_balance', 15, 2)->default(0);  // Saldo Simpanan Sukarela
            $table->text('avatar_url')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            $table->index('email');
            $table->index('member_id');
            $table->index('role');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
