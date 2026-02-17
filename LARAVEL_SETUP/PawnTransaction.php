<?php
// File: app/Models/PawnTransaction.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PawnTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'item_name',
        'loan_amount',
        'description',
        'status',
        'approval_notes',
        'approved_by',
        'approved_at',
    ];

    protected $casts = [
        'loan_amount' => 'decimal:2',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ===== RELATIONS =====
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // ===== SCOPES =====
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }
}
