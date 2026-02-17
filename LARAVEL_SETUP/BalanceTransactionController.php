<?php
// File: app/Http/Controllers/Api/BalanceTransactionController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BalanceTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class BalanceTransactionController extends Controller
{
    /**
     * GET /api/balance
     * Ambil history transaksi saldo user
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $balanceTransactions = BalanceTransaction::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'message' => 'Data transaksi saldo berhasil diambil',
                'data' => $balanceTransactions,
                'balance' => [
                    'tapro_balance' => $user->tapro_balance,
                    'simpok_balance' => $user->simpok_balance,
                    'simwa_balance' => $user->simwa_balance,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/balance
     * Buat transaksi saldo baru (topup, withdraw, transfer)
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'type' => 'required|in:topup,withdraw,transfer',
                'amount' => 'required|numeric|min:10000',
                'payment_method' => 'nullable|string',
                'notes' => 'nullable|string',
            ]);

            // Validasi saldo untuk withdraw
            if ($validated['type'] === 'withdraw' && $user->tapro_balance < $validated['amount']) {
                return response()->json([
                    'message' => 'Saldo tidak cukup untuk melakukan withdraw',
                ], 400);
            }

            // Generate reference number
            $referenceNumber = 'TXN' . date('YmdHis') . $user->id;

            // Buat transaksi
            $balanceTransaction = BalanceTransaction::create([
                'user_id' => $user->id,
                'type' => $validated['type'],
                'amount' => $validated['amount'],
                'status' => 'pending',
                'reference_number' => $referenceNumber,
                'payment_method' => $validated['payment_method'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Update saldo user (bisa langsung atau pending approval)
            // Di sini kita langsung approve untuk demo
            if ($validated['type'] === 'topup') {
                $user->increment('tapro_balance', $validated['amount']);
                $balanceTransaction->update(['status' => 'success']);
            } elseif ($validated['type'] === 'withdraw') {
                $user->decrement('tapro_balance', $validated['amount']);
                $balanceTransaction->update(['status' => 'success']);
            }

            return response()->json([
                'message' => 'Transaksi saldo berhasil dibuat',
                'data' => $balanceTransaction,
                'new_balance' => $user->refresh()->tapro_balance,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * GET /api/balance/{id}
     * Ambil detail transaksi saldo
     */
    public function show(Request $request, BalanceTransaction $balance)
    {
        try {
            if ($balance->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Tidak diizinkan mengakses data ini',
                ], 403);
            }

            return response()->json([
                'message' => 'Data transaksi saldo berhasil diambil',
                'data' => $balance->load('user'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/balance-summary
     * Ambil ringkasan saldo user
     */
    public function summary(Request $request)
    {
        try {
            $user = $request->user();

            // Hitung total topup, withdraw, dan balance
            $totalTopup = BalanceTransaction::where('user_id', $user->id)
                ->where('type', 'topup')
                ->where('status', 'success')
                ->sum('amount');

            $totalWithdraw = BalanceTransaction::where('user_id', $user->id)
                ->where('type', 'withdraw')
                ->where('status', 'success')
                ->sum('amount');

            return response()->json([
                'message' => 'Ringkasan saldo berhasil diambil',
                'data' => [
                    'tapro_balance' => (float) $user->tapro_balance,
                    'simpok_balance' => (float) $user->simpok_balance,
                    'simwa_balance' => (float) $user->simwa_balance,
                    'total_topup' => (float) $totalTopup,
                    'total_withdraw' => (float) $totalWithdraw,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
