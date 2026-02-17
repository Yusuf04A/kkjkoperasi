# 🎯 PANDUAN INTEGRASI REACT DENGAN LARAVEL API

## 1️⃣ SETUP API CLIENT (Axios)

File sudah ada di project Anda: `src/api/api.ts`

Pastikan konfigurasinya benar:

```typescript
import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

/**
 * Interceptor untuk otomatis menambahkan token ke setiap request
 */
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Handle error response (401, 403, dll)
 */
API.interceptors.response.use(
    response => response,
    error => {
        // Jika unauthorized (token expired), redirect ke login
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
```

## 2️⃣ UPDATE AUTH FUNCTIONS

Update file `src/api/api.ts` dengan menambahkan auth functions:

```typescript
/**
 * AUTHENTICATION FUNCTIONS
 */

// Register user baru
export const register = (data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    phone?: string;
}) => API.post<{message: string, user: any, token: string}>('/register', data);

// Login user
export const login = (email: string, password: string) => 
    API.post<{message: string, user: any, token: string}>('/login', { email, password });

// Logout user
export const logout = () => 
    API.post('/logout');

// Get user profile
export const getUserProfile = () => 
    API.get('/user-profile');

// Update user profile
export const updateProfile = (data: Partial<UserProfile>) => 
    API.put('/user-profile', data);

// Change password
export const changePassword = (oldPassword: string, newPassword: string) => 
    API.post('/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirmation: newPassword,
    });
```

## 3️⃣ LOGIN PAGE EXAMPLE

Update `src/pages/auth/Login.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { login } from '../api/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Login() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await login(email, password);
            
            if (response.data.token && response.data.user) {
                // Simpan ke Zustand store dan localStorage
                setAuth(response.data.user, response.data.token);
                
                // Redirect ke dashboard
                navigate('/dashboard');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Login gagal';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="text-red-600">{error}</div>}
            
            <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
            
            <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
            
            <Button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
            </Button>
        </form>
    );
}
```

## 4️⃣ REGISTER PAGE EXAMPLE

Update `src/pages/auth/Register.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { register } from '../api/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function Register() {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await register(formData);
            
            if (response.data.token && response.data.user) {
                setAuth(response.data.user, response.data.token);
                navigate('/dashboard');
            }
        } catch (err: any) {
            const message = err.response?.data?.message || 'Registrasi gagal';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleRegister} className="space-y-4">
            {error && <div className="text-red-600">{error}</div>}
            
            <Input
                name="name"
                placeholder="Nama Lengkap"
                value={formData.name}
                onChange={handleChange}
                required
            />
            
            <Input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
            />
            
            <Input
                name="phone"
                placeholder="No. Telepon"
                value={formData.phone}
                onChange={handleChange}
            />
            
            <Input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
            />
            
            <Input
                name="password_confirmation"
                type="password"
                placeholder="Konfirmasi Password"
                value={formData.password_confirmation}
                onChange={handleChange}
                required
            />
            
            <Button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Register'}
            </Button>
        </form>
    );
}
```

## 5️⃣ PAWN TRANSACTION EXAMPLE

```typescript
import { useState, useEffect } from 'react';
import API from '../api/api';

interface PawnTransaction {
    id?: number;
    user_id: number;
    item_name: string;
    loan_amount: number;
    status: 'pending' | 'approved' | 'rejected';
    created_at?: string;
}

export default function PawnForm() {
    const [formData, setFormData] = useState<Partial<PawnTransaction>>({
        item_name: '',
        loan_amount: 0,
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const response = await API.post('/pawn', formData);
            setSuccess('Pengajuan gadai berhasil dibuat!');
            setFormData({ item_name: '', loan_amount: 0 });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Gagal membuat pengajuan');
        } finally {
            setLoading(false);
        }
    };

    const fetchPawnTransactions = async () => {
        try {
            const response = await API.get('/pawn');
            console.log('Pawn transactions:', response.data.data);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching pawn transactions:', error);
        }
    };

    useEffect(() => {
        fetchPawnTransactions();
    }, []);

    return (
        <div>
            <h2>Ajukan Gadai</h2>
            
            {error && <div className="text-red-600">{error}</div>}
            {success && <div className="text-green-600">{success}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    name="item_name"
                    placeholder="Nama Barang"
                    value={formData.item_name}
                    onChange={handleChange}
                    required
                />
                
                <input
                    name="loan_amount"
                    type="number"
                    placeholder="Jumlah Pinjaman"
                    value={formData.loan_amount}
                    onChange={handleChange}
                    required
                    min="10000"
                />
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Ajukan Gadai'}
                </button>
            </form>
        </div>
    );
}
```

## 6️⃣ BALANCE TRANSACTION EXAMPLE

```typescript
import { useState, useEffect } from 'react';
import API from '../api/api';

interface BalanceTransaction {
    id?: number;
    user_id: number;
    type: 'topup' | 'withdraw' | 'transfer';
    amount: number;
    status: 'success' | 'pending' | 'failed';
}

export default function BalanceForm() {
    const [formData, setFormData] = useState<Partial<BalanceTransaction>>({
        type: 'topup',
        amount: 0,
    });
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch balance summary
    const fetchBalance = async () => {
        try {
            const response = await API.get('/balance-summary');
            setBalance(response.data.data.tapro_balance);
        } catch (err) {
            console.error('Error fetching balance:', err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await API.post('/balance', formData);
            setFormData({ type: 'topup', amount: 0 });
            fetchBalance(); // Refresh balance
        } catch (err: any) {
            setError(err.response?.data?.message || 'Transaksi gagal');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, []);

    return (
        <div>
            <h2>Saldo: Rp {balance.toLocaleString('id-ID')}</h2>
            
            {error && <div className="text-red-600">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                >
                    <option value="topup">Top Up</option>
                    <option value="withdraw">Withdraw</option>
                </select>
                
                <input
                    type="number"
                    placeholder="Jumlah"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                    required
                    min="10000"
                />
                
                <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Lakukan Transaksi'}
                </button>
            </form>
        </div>
    );
}
```

## 7️⃣ NOTIFICATIONS EXAMPLE

```typescript
import { useEffect, useState } from 'react';
import API from '../api/api';

export default function NotificationsList() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();
        
        // Refresh setiap 30 detik
        const interval = setInterval(() => {
            fetchUnreadCount();
        }, 30000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await API.get('/notifications');
            setNotifications(response.data.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await API.get('/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await API.put(`/notifications/${id}/read`);
            fetchNotifications();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    return (
        <div>
            <h2>Notifikasi ({unreadCount} baru)</h2>
            
            <div className="space-y-2">
                {notifications.map((notif: any) => (
                    <div key={notif.id} className={`p-3 border rounded ${!notif.read_at ? 'bg-blue-50' : ''}`}>
                        <h3>{notif.title}</h3>
                        <p>{notif.message}</p>
                        {!notif.read_at && (
                            <button onClick={() => markAsRead(notif.id)}>
                                Tandai sudah dibaca
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
```

## 8️⃣ ERROR HANDLING BEST PRACTICES

```typescript
interface ApiError {
    message: string;
    errors?: Record<string, string[]>;
}

// Di setiap API call:
try {
    const response = await API.post('/endpoint', data);
    // Success logic
} catch (error: any) {
    if (error.response?.status === 401) {
        // Unauthorized - token expired
        console.log('Token expired, redirect to login');
    } else if (error.response?.status === 422) {
        // Validation error
        const errors = error.response.data.errors;
        console.log('Validation errors:', errors);
    } else if (error.response?.status === 403) {
        // Forbidden
        console.log('Access denied');
    } else {
        // Other errors
        const message = error.response?.data?.message || 'Unknown error';
        console.log('Error:', message);
    }
}
```

## ✅ CHECKLIST

- [ ] Laravel backend running di http://127.0.0.1:8000
- [ ] Database migrations sudah dijalankan
- [ ] Sanctum sudah diinstall dan dikonfigurasi
- [ ] CORS sudah dikonfigurasi dengan benar
- [ ] React app running di http://localhost:5173
- [ ] API client (Axios) sudah dikonfigurasi
- [ ] Login/Register bekerja dengan baik
- [ ] Token disimpan di localStorage
- [ ] Protected routes berfungsi
- [ ] Notifications berjalan
