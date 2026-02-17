<?php
// File: app/Models/User.php
// Tambahkan ke model User yang sudah ada atau replace

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'role',
        'status',
        'member_id',
        'tapro_balance',
        'simpok_balance',
        'simwa_balance',
        'avatar_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'tapro_balance' => 'decimal:2',
        'simpok_balance' => 'decimal:2',
        'simwa_balance' => 'decimal:2',
    ];

    // ===== RELATIONS =====
    public function pawnTransactions()
    {
        return $this->hasMany(PawnTransaction::class);
    }

    public function balanceTransactions()
    {
        return $this->hasMany(BalanceTransaction::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    // ===== SCOPES =====
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeMembers($query)
    {
        return $query->where('role', 'member');
    }
}
