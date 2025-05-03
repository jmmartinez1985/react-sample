import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@context/AuthContext';

// Páginas de autenticación
import Login from '@pages/Login';
import Register from '@pages/Register';
import ConfirmAccount from '@pages/ConfirmAccount';
import ForgotPassword from '@pages/ForgotPassword';
import ResetPassword from '@pages/ResetPassword';

// Páginas de la aplicación
import Dashboard from '@pages/Dashboard';
import UserProfile from '@pages/UserProfile';
import ProductDetail from '@pages/ProductDetail';
import ProductMovements from '@pages/ProductMovements';
import NotFound from '@pages/NotFound';

// Redireccionamiento condicional
const AuthRouter: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/confirm-account" element={<ConfirmAccount />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Rutas protegidas */}
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/profile" element={<UserProfile />} />

                    {/* Nuevas rutas para productos */}
                    <Route path="/products/:productId/detail" element={<ProductDetail />} />
                    <Route path="/products/:productId/movements" element={<ProductMovements />} />

                    {/* Redirección del inicio */}
                    <Route path="/" element={<Login />} />

                    {/* Ruta 404 */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
};

function App() {
    return <AuthRouter />;
}

export default App;