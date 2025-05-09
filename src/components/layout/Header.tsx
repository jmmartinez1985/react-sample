// src/components/layout/Header.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HeaderProps } from '@/types';
import Button from '@components/ui/Button';
import ConfirmDialog from '@components/ui/ConfirmDialog';

const Header: React.FC<HeaderProps> = ({
                                           isAuthenticated = false,
                                           onLogout,
                                           username = ''
                                       }) => {
    // URL del logo de La Hipotecaria
    const logoUrl = 'https://www.lahipotecaria.com/panama/wp-content/themes/la-hipotecaria/assets/img/logo_la_hipotecaria.png';
    const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

    const handleLogoutClick = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = () => {
        setShowLogoutConfirm(false);
        if (onLogout) {
            onLogout();
        }
    };

    const cancelLogout = () => {
        setShowLogoutConfirm(false);
    };

    return (
        <header className="bg-white shadow-sm py-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <Link to="/" className="block">
                            <img
                                className="h-10 w-auto"
                                src={logoUrl}
                                alt="La Hipotecaria"
                            />
                        </Link>
                    </div>

                    {/* Botones de autenticación */}
                    <div className="flex items-center space-x-3">
                        {isAuthenticated ? (
                            <>
                                <span className="text-sm text-gray-700 mr-2">
                                    Hola, <span className="font-medium">{username}</span>
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleLogoutClick}
                                    className="border border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    Cerrar Sesión
                                </Button>
                            </>
                        ) : (
                            <>
                                <Link to="/login">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        Iniciar Sesión
                                    </Button>
                                </Link>
                                <Link to="/register">
                                    <Button
                                        size="sm"
                                        className="bg-[#B71234] hover:bg-[#951029] text-white"
                                    >
                                        Registrarse
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Diálogo de confirmación para cerrar sesión */}
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                title="Confirmar cierre de sesión"
                message="¿Estás seguro de que deseas cerrar sesión? Esta acción finalizará tu sesión activa."
                confirmLabel="Sí, cerrar sesión"
                cancelLabel="Cancelar"
                onConfirm={confirmLogout}
                onCancel={cancelLogout}
            />
        </header>
    );
};

export default Header;