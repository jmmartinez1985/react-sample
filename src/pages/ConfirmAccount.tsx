import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '@components/layout/AuthLayout';
import ConfirmAccountForm from '@components/auth/ConfirmAccountForm';
import useAuth from '@hooks/useAuth';

const ConfirmAccount: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // Si está autenticado, redirigir al dashboard
    if (isAuthenticated && !isLoading) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <AuthLayout
            title="Confirmar Cuenta"
            subtitle="Ingresa el código de verificación que enviamos a tu email"
        >
            <ConfirmAccountForm />
        </AuthLayout>
    );
};

export default ConfirmAccount;