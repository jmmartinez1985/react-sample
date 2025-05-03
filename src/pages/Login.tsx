import React, { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import AuthLayout from '@components/layout/AuthLayout';
import LoginForm from '@components/auth/LoginForm';
import Alert from '@components/ui/Alert';
import useAuth from '@hooks/useAuth';

interface LocationState {
    message?: string;
}

const Login: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();
    const locationState = location.state as LocationState;

    const [message, setMessage] = useState<string | null>(null);

    // Mostrar mensaje si viene en el estado de la navegación
    useEffect(() => {
        if (locationState?.message) {
            setMessage(locationState.message);
        }
    }, [locationState]);

    // Si está autenticado, redirigir al dashboard
    if (isAuthenticated && !isLoading) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <AuthLayout
            title="Iniciar Sesión"
            subtitle="Ingresa tus credenciales para acceder a tu cuenta"
        >
            {message && (
                <Alert
                    variant="success"
                    className="mb-6"
                    onClose={() => setMessage(null)}
                >
                    {message}
                </Alert>
            )}

            <LoginForm />
        </AuthLayout>
    );
};

export default Login;