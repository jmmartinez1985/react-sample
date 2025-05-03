import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '@components/layout/AuthLayout';
import ForgotPasswordForm from '@components/auth/ForgotPasswordForm';
import useAuth from '@hooks/useAuth';

const ForgotPassword: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // Si está autenticado, redirigir al dashboard
    if (isAuthenticated && !isLoading) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <AuthLayout
            title="Recuperar Contraseña"
            subtitle="Te enviaremos instrucciones para recuperar tu contraseña"
        >
            <ForgotPasswordForm />
        </AuthLayout>
    );
};

export default ForgotPassword;