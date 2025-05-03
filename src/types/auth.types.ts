// Definición de tipos para la API de autenticación

// Respuestas de la API
export interface TokenResponse {
    token_type: string;
    access_token: string;
    id_token: string;
    refresh_token: string;
    expires_in: number;
}

export interface SignUpResponse {
    message: string;
    userSub: string;
    userConfirmed: boolean;
}

export interface ConfirmResponse {
    message: string;
}

export interface ForgotPasswordResponse {
    message: string;
    deliveryMedium: string;
    destination: string;
}

export interface ResetPasswordResponse {
    message: string;
}

export interface ErrorResponse {
    error: string;
}

// Datos de usuario
export interface UserAttributes {
    email: string;
    email_verified: boolean;
    name?: string;
    sub: string;
    [key: string]: any;
}

export interface User {
    username: string;
    attributes: UserAttributes;
}

// Datos para solicitudes
export interface SignUpData {
    username: string;
    password: string;
    email: string;
    name?: string;
}

export interface ConfirmSignUpData {
    username: string;
    confirmationCode: string;
}

export interface LoginData {
    username: string;
    password: string;
}

export interface RefreshTokenData {
    refresh_token: string;
}

export interface ForgotPasswordData {
    username: string;
}

export interface ResetPasswordData {
    username: string;
    confirmationCode: string;
    newPassword: string;
}

// Contexto de autenticación
export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (username: string, password: string) => Promise<boolean>;
    register: (userData: SignUpData) => Promise<SignUpResponse>;
    confirmAccount: (username: string, code: string) => Promise<ConfirmResponse>;
    forgotPassword: (username: string) => Promise<ForgotPasswordResponse>;
    resetPassword: (username: string, code: string, newPassword: string) => Promise<ResetPasswordResponse>;
    logout: () => Promise<void>;
}