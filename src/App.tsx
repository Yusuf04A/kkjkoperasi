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
import { Profile } from './pages/dashboard/Profile'; // <--- INI PROFILE YANG ASLI

// Import Admin
import { AdminVerification } from './pages/admin/Verification';
import { AdminDashboard } from './pages/admin/Dashboard'; // Pastikan file ini ada
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Placeholder Pages (Hanya untuk halaman yang belum dibuat)
const Transactions = () => <div className="p-4 pt-10">Halaman Transaksi</div>;
const Notification = () => <div className="p-4 pt-10">Halaman Notifikasi</div>;

// HAPUS BARIS INI: const Profile = ... (Karena sudah di-import di atas)

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

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/verifikasi" element={<AdminVerification />} />

        {/* Member Routes */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Home />} />
          <Route path="/transaksi" element={<Transactions />} />
          <Route path="/pembiayaan" element={<FinancingMenu />} />
          <Route path="/pembiayaan/ajukan" element={<SubmissionForm />} />
          <Route path="/notifikasi" element={<Notification />} />
          <Route path="/profil" element={<Profile />} /> {/* Memanggil Profile Asli */}
        </Route>

        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;