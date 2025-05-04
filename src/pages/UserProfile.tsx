import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Card from '@components/ui/Card';
import Alert from '@components/ui/Alert';

const UserProfile: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

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

    const handleSaveProfile = () => {
        try {
            // Simulación de guardado
            setTimeout(() => {
                setIsEditing(false);
                setSuccess('Perfil actualizado correctamente');

                // Ocultar mensaje después de 3 segundos
                setTimeout(() => {
                    setSuccess(null);
                }, 3000);
            }, 1000);
        } catch (err: any) {
            setError(err?.message || 'Error al actualizar el perfil');
        }
    };

    // Función para volver al dashboard
    const handleBackToDashboard = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header
                isAuthenticated={true}
                username={user?.attributes?.name || user?.username || ''}
                onLogout={logout}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleBackToDashboard}
                            className="flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Volver al Dashboard
                        </Button>
                    </div>

                    {success && (
                        <Alert
                            variant="success"
                            className="mb-6"
                            onClose={() => setSuccess(null)}
                        >
                            {success}
                        </Alert>
                    )}

                    {error && (
                        <Alert
                            variant="error"
                            className="mb-6"
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    <Card className="p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-medium text-gray-900">Información Personal</h2>
                            <Button
                                variant={isEditing ? "outline" : "primary"}
                                size="sm"
                                onClick={() => setIsEditing(!isEditing)}
                            >
                                {isEditing ? 'Cancelar' : 'Editar Perfil'}
                            </Button>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <Input
                                    label="Nombre completo"
                                    id="name"
                                    defaultValue={user?.attributes?.name || ''}
                                />

                                <Input
                                    label="Email"
                                    id="email"
                                    type="email"
                                    defaultValue={user?.username || ''}
                                    disabled
                                />

                                <div className="flex justify-end space-x-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button onClick={handleSaveProfile}>
                                        Guardar cambios
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Nombre completo</p>
                                    <p className="text-gray-900">{user?.attributes?.name || 'No especificado'}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Username</p>
                                    <p className="text-gray-900">{user?.username}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-gray-500">Email</p>
                                    <p className="text-gray-900">{user?.attributes?.email}</p>
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
                        )}
                    </Card>

                    <Card className="p-6">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Seguridad</h2>
                        <div className="space-y-4">
                            <Button variant="outline">
                                Cambiar contraseña
                            </Button>

                            <Button variant="danger">
                                Eliminar cuenta
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default UserProfile;