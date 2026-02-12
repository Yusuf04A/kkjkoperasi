import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// AUTH PAGES
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Welcome } from './pages/Welcome';
import { PendingVerification } from './pages/auth/PendingVerification';

// MEMBER PAGES
import { Home } from './pages/dashboard/Home';
import { Profile } from './pages/dashboard/Profile';
import { Notifications } from './pages/Notifications'; // Halaman Notifikasi Asli

// FINANCING
import { FinancingMenu } from './pages/financing/Menu';
import { SubmissionForm } from './pages/financing/SubmissionForm';

// TRANSACTIONS
import { TransactionMenu } from './pages/transactions/Menu'; // Menu HP Asli
import { TopUp } from './pages/transactions/TopUp';
import { TransactionHistory } from './pages/transactions/History';
import { Withdraw } from './pages/transactions/Withdraw';
import { Transfer } from './pages/transactions/Transfer';
import { SetorSimpanan } from './pages/transactions/SetorSimpanan';

// ADMIN PAGES
import { AdminVerification } from './pages/admin/Verification';
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminTransactions } from './pages/admin/Transactions';
import { AdminFinancing } from './pages/admin/Financing';
import AdminKabar from './pages/admin/AdminKabar';
import AdminKabarForm from './pages/admin/AdminKabarForm';
import { AdminFinancialReport } from './pages/admin/FinancialReport';
import { LoanDetail } from './pages/financing/LoanDetail';
import { AdminLoanDetail } from './pages/admin/LoanDetailAdmin';
import { AdminTamasa } from './pages/admin/AdminTamasa';
import { AdminTokoKatalog } from './pages/admin/AdminTokoKatalog'; // Sesuaikan path-nya

// PROGRAM
import { Tamasa } from './pages/program/Tamasa';
import { Inflip } from './pages/program/Inflip';
import { Pegadaian } from './pages/program/Pegadaian';
import { AdminPegadaian } from './pages/admin/AdminPegadaian';

// katalog
import { CheckoutBelanja } from './pages/katalog/CheckoutBelanja';

import { PPOB } from './pages/ppob/PPOB';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" reverseOrder={false} />

      <Routes>
        {/* === PUBLIC ROUTES (Bisa diakses tanpa login) === */}
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pending" element={<PendingVerification />} />

        {/* === ADMIN ROUTES === */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/verifikasi" element={<AdminVerification />} />
        <Route path="/admin/transaksi" element={<AdminTransactions />} />
        <Route path="/admin/pembiayaan" element={<AdminFinancing />} />
        <Route path="/admin/pembiayaan/:id" element={<AdminLoanDetail />} />
        <Route path="/admin/laporan" element={<AdminFinancialReport />} />
        <Route path="/admin/tamasa" element={<AdminTamasa />} />
        <Route path="/admin/toko" element={<AdminTokoKatalog />} />
<Route path="/admin/toko/katalog" element={<AdminTokoKatalog />} />


        {/* Admin Kabar */}
        <Route path="/admin/kabar" element={<AdminKabar />} />
        <Route path="/admin/kabar/tambah" element={<AdminKabarForm />} />
        <Route path="/admin/kabar/edit/:id" element={<AdminKabarForm />} />

        {/* === PROTECTED MEMBER ROUTES (Pakai Navbar/MainLayout) === */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route path="/" element={<Home />} />
          <Route path="/profil" element={<Profile />} />

          {/* Notifikasi (SUDAH FIX) */}
          <Route path="/notifikasi" element={<Notifications />} />

          {/* Menu Transaksi (Khusus HP - SUDAH FIX) */}
          <Route path="/transaksi" element={<TransactionMenu />} />

          {/* Fitur Transaksi */}
          <Route path="/transaksi/topup" element={<TopUp />} />
          <Route path="/transaksi/tarik" element={<Withdraw />} />
          <Route path="/transaksi/kirim" element={<Transfer />} />
          <Route path="/transaksi/riwayat" element={<TransactionHistory />} />
          <Route path="/transaksi/setor" element={<SetorSimpanan />} />

          {/* Fitur Pembiayaan */}
          <Route path="/pembiayaan" element={<FinancingMenu />} />
          <Route path="/pembiayaan/ajukan" element={<SubmissionForm />} />
          <Route path="/pembiayaan/:id" element={<LoanDetail />} />
        </Route>

        {/* Redirect unknown routes ke Welcome */}
        <Route path="*" element={<Navigate to="/welcome" replace />} />

        <Route path="/belanja/checkout" element={<CheckoutBelanja />} />

        
        <Route path="/program/tamasa" element={<Tamasa />} />
        <Route path="/program/inflip" element={<Inflip />} />
        <Route path="/program/pegadaian" element={<Pegadaian />} />
        <Route path="/admin/pegadaian" element={<AdminPegadaian />} />

        <Route path="/ppob" element={<PPOB />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;