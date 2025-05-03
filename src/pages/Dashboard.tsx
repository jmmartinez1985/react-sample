import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Button from '@components/ui/Button';

const Dashboard: React.FC = () => {
    const { isAuthenticated, isLoading, user, logout } = useAuth();

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated && !isLoading) {
        return <Navigate to="/login" replace />;
    }

    // Mostrar cargando mientras verifica autenticación
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header
                isAuthenticated={true}
                username={user?.attributes?.name || user?.username || ''}
                onLogout={logout}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
                    <p className="mb-4 text-gray-600">
                        ¡Bienvenido {user?.attributes?.name || user?.username}! Has iniciado sesión correctamente.
                    </p>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <h2 className="text-lg font-medium text-gray-900 mb-2">Información de usuario</h2>
                        <div className="bg-gray-50 p-4 rounded-md">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-gray-900">{user?.username}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Nombre</p>
                                    <p className="text-gray-900">{user?.attributes?.name || 'No especificado'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email verificado</p>
                                    <p className="text-gray-900">{user?.attributes?.email_verified ? 'Sí' : 'No'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">ID de usuario</p>
                                    <p className="text-gray-900">{user?.attributes?.sub}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Acciones</h2>
                    <div className="space-y-4">
                        <Button
                            variant="primary"
                            onClick={() => {
                                // Acción para actualizar perfil
                                alert('Funcionalidad en desarrollo');
                            }}
                        >
                            Actualizar Perfil
                        </Button>

                        <Button
                            variant="outline"
                            onClick={logout}
                        >
                            Cerrar Sesión
                        </Button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;