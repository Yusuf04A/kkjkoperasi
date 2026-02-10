import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Welcome } from './pages/Welcome';
import { PendingVerification } from './pages/auth/PendingVerification';
import { Home } from './pages/dashboard/Home';

// Import Halaman Utama
import { FinancingMenu } from './pages/financing/Menu';
import { SubmissionForm } from './pages/financing/SubmissionForm';
import { Profile } from './pages/dashboard/Profile';

// Import Admin
import { AdminVerification } from './pages/admin/Verification';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminTransactions } from './pages/admin/Transactions';

// 🔹 TAMBAHAN ADMIN KABAR
import AdminKabar from './pages/admin/AdminKabar';
import AdminKabarForm from './pages/admin/AdminKabarForm';

import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { TopUp } from './pages/transactions/TopUp';
import { TransactionHistory } from './pages/transactions/History';
import { Withdraw } from './pages/transactions/Withdraw';
import { Transfer } from './pages/transactions/Transfer';

// Placeholder Pages
const Transactions = () => <div className="p-4 pt-10">Halaman Transaksi</div>;
const Notification = () => <div className="p-4 pt-10">Halaman Notifikasi</div>;

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {/* Public Routes */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending" element={<PendingVerification />} />

        {/* Admin Routes (ASLI) */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/verifikasi" element={<AdminVerification />} />
        <Route path="/admin/transaksi" element={<AdminTransactions />} />

        {/* 🔹 Admin Kabar KKJ (TAMBAHAN, TIDAK MENGHAPUS APA PUN) */}
        <Route path="/admin/kabar" element={<AdminKabar />} />
        <Route path="/admin/kabar/tambah" element={<AdminKabarForm />} />
        <Route path="/admin/kabar/edit/:id" element={<AdminKabarForm />} />

        {/* Member Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/transaksi" element={<Transactions />} />
          <Route path="/pembiayaan" element={<FinancingMenu />} />
          <Route path="/pembiayaan/ajukan" element={<SubmissionForm />} />
          <Route path="/notifikasi" element={<Notification />} />
          <Route path="/profil" element={<Profile />} />
        </Route>

        {/* Lain-lain */}
        <Route path="/transaksi/topup" element={<TopUp />} />
        <Route path="/transaksi/riwayat" element={<TransactionHistory />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
        <Route path="/transaksi/tarik" element={<Withdraw />} />
        <Route path="/transaksi/kirim" element={<Transfer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
