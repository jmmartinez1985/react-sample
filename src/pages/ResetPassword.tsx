import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '@components/layout/AuthLayout';
import ResetPasswordForm from '@components/auth/ResetPasswordForm';
import useAuth from '@hooks/useAuth';

const ResetPassword: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // Si está autenticado, redirigir al dashboard
    if (isAuthenticated && !isLoading) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <AuthLayout
            title="Restablecer Contraseña"
            subtitle="Crea una nueva contraseña para tu cuenta"
        >
            <ResetPasswordForm />
        </AuthLayout>
    );
};

export default ResetPassword;