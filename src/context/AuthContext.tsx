import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '@services/authService';
import {
    User,
    AuthContextType,
    SignUpData,
    SignUpResponse,
    ConfirmResponse,
    ForgotPasswordResponse,
    ResetPasswordResponse
} from '@/types';

// Crear el contexto con un valor por defecto
export const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: async () => false,
    register: async () => ({ message: '', userSub: '', userConfirmed: false }),
    confirmAccount: async () => ({ message: '' }),
    forgotPassword: async () => ({ message: '', deliveryMedium: '', destination: '' }),
    resetPassword: async () => ({ message: '' }),
    logout: async () => {},
});

interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    // Verificar autenticación al cargar la aplicación
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setIsLoading(true);
                // Verificar si hay token válido
                if (authService.isAuthenticated()) {
                    // Obtener información del usuario
                    const userInfo = await authService.getUserInfo();
                    setUser(userInfo);
                    setIsAuthenticated(true);
                } else {
                    // Si hay refresh token, intentar renovar el token
                    const refreshToken = localStorage.getItem('refresh_token');
                    if (refreshToken) {
                        try {
                            await authService.refreshToken();
                            const userInfo = await authService.getUserInfo();
                            setUser(userInfo);
                            setIsAuthenticated(true);
                        } catch (refreshError) {
                            // Si falla el refresh, limpiar todo
                            await authService.logout();
                            setUser(null);
                            setIsAuthenticated(false);
                        }
                    } else {
                        setUser(null);
                        setIsAuthenticated(false);
                    }
                }
            } catch (error) {
                console.error('Error verificando autenticación:', error);
                setUser(null);
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Función para iniciar sesión
    const login = async (username: string, password: string): Promise<boolean> => {
        try {
            setIsLoading(true);
            setError(null);

            // Llamar al servicio de login
            await authService.login({ username, password });

            // Obtener información del usuario
            const userInfo = await authService.getUserInfo();

            setUser(userInfo);
            setIsAuthenticated(true);
            setError(null);

            return true;
        } catch (error: any) {
            setError(error?.error || 'Error de inicio de sesión');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // Función para registrar un usuario
    const register = async (userData: SignUpData): Promise<SignUpResponse> => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await authService.signUp(userData);
            return result;
        } catch (error: any) {
            setError(error?.error || 'Error en el registro');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Función para confirmar registro
    const confirmAccount = async (username: string, code: string): Promise<ConfirmResponse> => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await authService.confirmSignUp({ username, confirmationCode: code });
            return result;
        } catch (error: any) {
            setError(error?.error || 'Error en la confirmación de cuenta');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Función para solicitar reset de contraseña
    const forgotPassword = async (username: string): Promise<ForgotPasswordResponse> => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await authService.forgotPassword({ username });
            return result;
        } catch (error: any) {
            setError(error?.error || 'Error al solicitar restablecimiento de contraseña');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Función para restablecer contraseña
    const resetPassword = async (username: string, code: string, newPassword: string): Promise<ResetPasswordResponse> => {
        try {
            setIsLoading(true);
            setError(null);

            const result = await authService.resetPassword({
                username,
                confirmationCode: code,
                newPassword
            });
            return result;
        } catch (error: any) {
            setError(error?.error || 'Error al restablecer la contraseña');
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Función para cerrar sesión
    const logout = async (): Promise<void> => {
        try {
            setIsLoading(true);
            await authService.logout();
            setUser(null);
            setIsAuthenticated(false);
            navigate('/login');
        } catch (error) {
            console.error('Error durante logout:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Valores a proporcionar en el contexto
    const contextValue: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        confirmAccount,
        forgotPassword,
        resetPassword,
        logout,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;