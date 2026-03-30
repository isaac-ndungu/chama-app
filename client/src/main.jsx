import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ui/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ChamaDetail from './pages/ChamaDetail';
import Members from './pages/Members';
import Contributions from './pages/Contributions';
import Loans from './pages/Loans';
import AuditLog from './pages/AuditLog';
import NotFound from './pages/NotFound';
import './index.css'
import { Toaster } from 'react-hot-toast';
import { ChamaProvider } from './context/ChamaContext';
import { useParams } from 'react-router-dom';

const ChamaLayout = ({ children }) => {
  const { chamaId } = useParams();
  return <ChamaProvider chamaId={chamaId}>{children}</ChamaProvider>;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes*/}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chamas/:chamaId" element={<ChamaLayout><ChamaDetail /></ChamaLayout> } />
            <Route path="/chamas/:chamaId/members" element={<ChamaLayout><Members /></ChamaLayout>} />
            <Route path="/chamas/:chamaId/contributions" element={<ChamaLayout><Contributions /></ChamaLayout>} />
            <Route path="/chamas/:chamaId/loans" element={<ChamaLayout><Loans /></ChamaLayout>} />
            <Route path="/chamas/:chamaId/audit" element={<ChamaLayout><AuditLog /></ChamaLayout>} />
          </Route>

          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider >
    </BrowserRouter >
  </StrictMode>,
)
