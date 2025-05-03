import axios, { AxiosInstance } from 'axios';
import {
    SignUpData,
    SignUpResponse,
    ConfirmSignUpData,
    ConfirmResponse,
    LoginData,
    TokenResponse,
    RefreshTokenData,
    ForgotPasswordData,
    ForgotPasswordResponse,
    ResetPasswordData,
    ResetPasswordResponse,
    User
} from '@/types';

// Configuración de la API
// @ts-ignore
const API_URL: string = import.meta.env.VITE_API_URL || 'https://pt17v6dj00.execute-api.us-east-1.amazonaws.com/dev';

// Instancia de axios con configuración común
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a las solicitudes
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Servicio de autenticación
const authService = {
    // Registro de nuevo usuario
    signUp: async (userData: SignUpData): Promise<SignUpResponse> => {
        try {
            const response = await apiClient.post<SignUpResponse>('/auth/signup', userData);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error en el registro' };
        }
    },

    // Confirmar registro de usuario
    confirmSignUp: async (data: ConfirmSignUpData): Promise<ConfirmResponse> => {
        try {
            const response = await apiClient.post<ConfirmResponse>('/auth/confirm', data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error en la confirmación' };
        }
    },

    // Iniciar sesión
    login: async (credentials: LoginData): Promise<TokenResponse> => {
        try {
            const response = await apiClient.post<TokenResponse>('/auth/login', credentials);

            // Guardar tokens en localStorage
            const { access_token, refresh_token, id_token, expires_in } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            localStorage.setItem('id_token', id_token);

            // Calcular tiempo de expiración
            const expiresAt = new Date().getTime() + expires_in * 1000;
            localStorage.setItem('expires_at', expiresAt.toString());

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error en el inicio de sesión' };
        }
    },

    // Refrescar token
    refreshToken: async (): Promise<TokenResponse> => {
        try {
            const refreshToken = localStorage.getItem('refresh_token');

            if (!refreshToken) {
                throw new Error('No hay refresh token disponible');
            }

            const data: RefreshTokenData = {
                refresh_token: refreshToken
            };

            const response = await apiClient.post<TokenResponse>('/auth/refresh-token', data);

            // Actualizar tokens en localStorage
            const { access_token, id_token, expires_in } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('id_token', id_token);

            // Actualizar tiempo de expiración
            const expiresAt = new Date().getTime() + expires_in * 1000;
            localStorage.setItem('expires_at', expiresAt.toString());

            return response.data;
        } catch (error) {
            // Si hay error, limpiar localStorage
            authService.logout();
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error al refrescar el token' };
        }
    },

    // Olvidé mi contraseña
    forgotPassword: async (data: ForgotPasswordData): Promise<ForgotPasswordResponse> => {
        try {
            const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error al solicitar recuperación de contraseña' };
        }
    },

    // Restablecer contraseña
    resetPassword: async (data: ResetPasswordData): Promise<ResetPasswordResponse> => {
        try {
            const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', data);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error al restablecer la contraseña' };
        }
    },

    // Cerrar sesión
    logout: async (): Promise<void> => {
        try {
            // Intentar hacer logout en el servidor si hay token
            const token = localStorage.getItem('access_token');
            if (token) {
                await apiClient.post('/auth/logout');
            }
        } catch (error) {
            console.error('Error al cerrar sesión en el servidor:', error);
        } finally {
            // Limpiar localStorage independientemente del resultado
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('id_token');
            localStorage.removeItem('expires_at');
        }
    },

    // Obtener información del usuario
    getUserInfo: async (): Promise<User> => {
        try {
            const response = await apiClient.get<User>('/auth/user-info');
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error al obtener información del usuario' };
        }
    },

    // Verificar si el usuario está autenticado
    isAuthenticated: (): boolean => {
        const expiresAt = localStorage.getItem('expires_at');
        return !!expiresAt && new Date().getTime() < parseInt(expiresAt);
    },
};

export default authService;