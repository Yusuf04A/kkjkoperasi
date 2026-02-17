<?php
// File: routes/api.php
// Replace seluruh isi routes/api.php dengan kode ini

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PawnTransactionController;
use App\Http\Controllers\Api\BalanceTransactionController;
use App\Http\Controllers\Api\NotificationController;

/**
 * ==========================================
 * PUBLIC ROUTES (Tidak perlu token)
 * ==========================================
 */
Route::group(['prefix' => 'api'], function () {
    // Auth routes
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

/**
 * ==========================================
 * PROTECTED ROUTES (Perlu token Sanctum)
 * ==========================================
 */
Route::group(['prefix' => 'api', 'middleware' => 'auth:sanctum'], function () {
    
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user-profile', [AuthController::class, 'profile']);
    Route::put('/user-profile', [AuthController::class, 'updateProfile']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Pawn Transaction routes (CRUD)
    Route::get('/pawn', [PawnTransactionController::class, 'index']);
    Route::post('/pawn', [PawnTransactionController::class, 'store']);
    Route::get('/pawn/{pawn}', [PawnTransactionController::class, 'show']);
    Route::put('/pawn/{pawn}', [PawnTransactionController::class, 'update']);
    Route::delete('/pawn/{pawn}', [PawnTransactionController::class, 'destroy']);
    
    // Admin routes untuk pawn transaction
    Route::post('/pawn/{pawn}/approve', [PawnTransactionController::class, 'approve']);
    Route::post('/pawn/{pawn}/reject', [PawnTransactionController::class, 'reject']);

    // Balance Transaction routes (CRUD)
    Route::get('/balance', [BalanceTransactionController::class, 'index']);
    Route::post('/balance', [BalanceTransactionController::class, 'store']);
    Route::get('/balance/{balance}', [BalanceTransactionController::class, 'show']);
    Route::get('/balance-summary', [BalanceTransactionController::class, 'summary']);

    // Notification routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
});

// Fallback untuk undefined routes
Route::fallback(function () {
    return response()->json([
        'message' => 'Endpoint tidak ditemukan',
    ], 404);
});
