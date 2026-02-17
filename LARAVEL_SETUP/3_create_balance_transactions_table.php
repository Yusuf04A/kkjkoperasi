<?php
// File: database/migrations/[timestamp]_create_balance_transactions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('balance_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['topup', 'withdraw', 'transfer'])->default('topup');
            $table->decimal('amount', 15, 2);
            $table->enum('status', ['success', 'pending', 'failed'])->default('pending');
            $table->string('reference_number')->nullable()->unique();
            $table->string('payment_method')->nullable(); // bank transfer, cash, dll
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('type');
            $table->index('status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('balance_transactions');
    }
};
