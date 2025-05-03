import { jwtDecode } from 'jwt-decode';

interface TokenPayload {
    exp: number;
    sub: string;
    username?: string;
    email?: string;
    [key: string]: any;
}

export const getTokenPayload = (token: string): TokenPayload | null => {
    try {
        return jwtDecode<TokenPayload>(token);
    } catch (error) {
        console.error('Error decodificando token:', error);
        return null;
    }
};

export const isTokenExpired = (token: string): boolean => {
    const payload = getTokenPayload(token);
    if (!payload) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
};

export const getExpirationDate = (token: string): Date | null => {
    const payload = getTokenPayload(token);
    if (!payload) return null;

    return new Date(payload.exp * 1000);
};