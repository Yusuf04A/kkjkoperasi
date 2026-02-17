<?php
// File: app/Models/BalanceTransaction.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BalanceTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'status',
        'reference_number',
        'payment_method',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ===== RELATIONS =====
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // ===== SCOPES =====
    public function scopeSuccess($query)
    {
        return $query->where('status', 'success');
    }

    public function scopeTopup($query)
    {
        return $query->where('type', 'topup');
    }
}
