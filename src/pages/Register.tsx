import React from 'react';
import { Navigate } from 'react-router-dom';
import AuthLayout from '@components/layout/AuthLayout';
import RegisterForm from '@components/auth/RegisterForm';
import useAuth from '@hooks/useAuth';

const Register: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    // Si está autenticado, redirigir al dashboard
    if (isAuthenticated && !isLoading) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <AuthLayout
            title="Crear Cuenta"
            subtitle="Regístrate para acceder a la plataforma"
        >
            <RegisterForm />
        </AuthLayout>
    );
};

export default Register;