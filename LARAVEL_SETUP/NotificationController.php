<?php
// File: app/Http/Controllers/Api/NotificationController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notifications
     * Ambil semua notifikasi user
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $notifications = Notification::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'message' => 'Notifikasi berhasil diambil',
                'data' => $notifications,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * GET /api/notifications/unread-count
     * Hitung notifikasi yang belum dibaca
     */
    public function unreadCount(Request $request)
    {
        try {
            $user = $request->user();
            
            $count = Notification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->count();

            return response()->json([
                'count' => $count,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/notifications/{id}/read
     * Tandai notifikasi sebagai sudah dibaca
     */
    public function markAsRead(Request $request, Notification $notification)
    {
        try {
            if ($notification->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Tidak diizinkan',
                ], 403);
            }

            $notification->markAsRead();

            return response()->json([
                'message' => 'Notifikasi sudah ditandai sebagai dibaca',
                'data' => $notification,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/notifications/mark-all-read
     * Tandai semua notifikasi sebagai sudah dibaca
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $user = $request->user();
            
            Notification::where('user_id', $user->id)
                ->whereNull('read_at')
                ->update(['read_at' => now()]);

            return response()->json([
                'message' => 'Semua notifikasi sudah ditandai sebagai dibaca',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/notifications/{id}
     * Hapus notifikasi
     */
    public function destroy(Request $request, Notification $notification)
    {
        try {
            if ($notification->user_id !== $request->user()->id) {
                return response()->json([
                    'message' => 'Tidak diizinkan',
                ], 403);
            }

            $notification->delete();

            return response()->json([
                'message' => 'Notifikasi berhasil dihapus',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error: ' . $e->getMessage(),
            ], 500);
        }
    }
}
