<?php
// File: app/Http/Controllers/Api/PawnTransactionController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PawnTransaction;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PawnTransactionController extends Controller
{
    /**
     * GET /api/pawn
     * Ambil semua transaksi gadai user yang login
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $pawnTransactions = PawnTransaction::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'message' => 'Data gadai berhasil diambil',
                'data' => $pawnTransactions,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/pawn
     * Buat pengajuan gadai baru
     */
    public function store(Request $request)
    {
        try {
            $user = $request->user();

            $validated = $request->validate([
                'item_name' => 'required|string|max:255',
                'loan_amount' => 'required|numeric|min:10000',
                'description' => 'nullable|string',
            ]);

            $pawnTransaction = PawnTransaction::create([
                'user_id' => $user->id,
                'item_name' => $validated['item_name'],
                'loan_amount' => $validated['loan_amount'],
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
            ]);

            // Buat notifikasi untuk admin
            Notification::create([
                'user_id' => 1, // Asumsikan user ID 1 adalah admin
                'title' => 'Pengajuan Gadai Baru',
                'message' => "{$user->name} mengajukan gadai untuk {$validated['item_name']}",
                'type' => 'info',
            ]);

            // Buat notifikasi untuk user
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Pengajuan Gadai Diterima',
                'message' => 'Pengajuan gadai Anda sedang diproses oleh tim kami',
                'type' => 'info',
            ]);

            return response()->json([
                'message' => 'Pengajuan gadai berhasil dibuat',
                'data' => $pawnTransaction,
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * GET /api/pawn/{id}
     * Ambil detail transaksi gadai
     */
    public function show(Request $request, PawnTransaction $pawn)
    {
        try {
            // Cek apakah user adalah pemilik atau admin
            if ($pawn->user_id !== $request->user()->id && $request->user()->role !== 'admin') {
                return response()->json([
                    'message' => 'Tidak diizinkan mengakses data ini',
                ], 403);
            }

            return response()->json([
                'message' => 'Data gadai berhasil diambil',
                'data' => $pawn->load('user', 'approver'),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/pawn/{id}
     * Update pengajuan gadai (hanya untuk status pending)
     */
    public function update(Request $request, PawnTransaction $pawn)
    {
        try {
            // Validasi ownership
            if ($pawn->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Anda tidak bisa mengubah data ini',
                ], 403);
            }

            // Hanya bisa update jika status masih pending
            if ($pawn->status !== 'pending') {
                return response()->json([
                    'message' => 'Hanya pengajuan dengan status pending yang bisa diubah',
                ], 400);
            }

            $validated = $request->validate([
                'item_name' => 'sometimes|string|max:255',
                'loan_amount' => 'sometimes|numeric|min:10000',
                'description' => 'sometimes|string',
            ]);

            $pawn->update($validated);

            return response()->json([
                'message' => 'Pengajuan gadai berhasil diperbarui',
                'data' => $pawn,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * DELETE /api/pawn/{id}
     * Hapus pengajuan gadai (hanya untuk status pending)
     */
    public function destroy(Request $request, PawnTransaction $pawn)
    {
        try {
            if ($pawn->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Anda tidak bisa menghapus data ini',
                ], 403);
            }

            if ($pawn->status !== 'pending') {
                return response()->json([
                    'message' => 'Hanya pengajuan dengan status pending yang bisa dihapus',
                ], 400);
            }

            $pawn->delete();

            return response()->json([
                'message' => 'Pengajuan gadai berhasil dihapus',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/pawn/{id}/approve (ADMIN ONLY)
     * Approve pengajuan gadai
     */
    public function approve(Request $request, PawnTransaction $pawn)
    {
        try {
            // Cek apakah user adalah admin
            if ($request->user()->role !== 'admin') {
                return response()->json([
                    'message' => 'Hanya admin yang bisa approve pengajuan',
                ], 403);
            }

            $validated = $request->validate([
                'approval_notes' => 'nullable|string',
            ]);

            $pawn->update([
                'status' => 'approved',
                'approval_notes' => $validated['approval_notes'] ?? null,
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            // Buat notifikasi untuk user
            Notification::create([
                'user_id' => $pawn->user_id,
                'title' => 'Pengajuan Gadai Disetujui',
                'message' => "Pengajuan gadai Anda untuk {$pawn->item_name} telah disetujui",
                'type' => 'success',
            ]);

            return response()->json([
                'message' => 'Pengajuan gadai berhasil disetujui',
                'data' => $pawn,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        }
    }

    /**
     * POST /api/pawn/{id}/reject (ADMIN ONLY)
     * Reject pengajuan gadai
     */
    public function reject(Request $request, PawnTransaction $pawn)
    {
        try {
            if ($request->user()->role !== 'admin') {
                return response()->json([
                    'message' => 'Hanya admin yang bisa reject pengajuan',
                ], 403);
            }

            $validated = $request->validate([
                'approval_notes' => 'required|string',
            ]);

            $pawn->update([
                'status' => 'rejected',
                'approval_notes' => $validated['approval_notes'],
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            // Buat notifikasi untuk user
            Notification::create([
                'user_id' => $pawn->user_id,
                'title' => 'Pengajuan Gadai Ditolak',
                'message' => "Pengajuan gadai Anda untuk {$pawn->item_name} telah ditolak. Alasan: {$validated['approval_notes']}",
                'type' => 'warning',
            ]);

            return response()->json([
                'message' => 'Pengajuan gadai berhasil ditolak',
                'data' => $pawn,
            ], 200);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validasi gagal',
                'errors' => $e->errors(),
            ], 422);
        }
    }
}
