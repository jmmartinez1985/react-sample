// src/services/favoritesService.ts

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// @ts-ignore
const FAVORITES_API_URL: string = import.meta.env.FAVORITES_API_URL || 'https://16hkp330wl.execute-api.us-east-1.amazonaws.com/dev/v1';

export enum FavoriteType {
    TRANSFER = 'TRANSFER',
    CREDIT_CARD_PAYMENT = 'CREDIT_CARD_PAYMENT',
    LOAN_PAYMENT = 'LOAN_PAYMENT'
}

export interface Favorite {
    favoriteId: string;
    customerId: string;
    favoriteType: FavoriteType;
    name: string;
    description?: string;
    destinationAccount?: string;
    destinationBank?: string;
    destinationName?: string;
    cardNumber?: string;
    loanNumber?: string;
    createdAt: string;
    updatedAt?: string;
    mail?: string;
}

export interface FavoriteCreateRequest {
    favoriteType: FavoriteType;
    name: string;
    description?: string;
    destinationAccount?: string;
    destinationBank?: string;
    destinationName?: string;
    cardNumber?: string;
    loanNumber?: string;
    mail?: string;
}

export interface FavoritesListResponse {
    status: {
        code: string;
        message: string;
    };
    data: {
        favorites: Favorite[];
        count: number;
    };
}

export interface FavoriteResponse {
    status: {
        code: string;
        message: string;
    };
    data: Favorite;
}

export interface DeleteFavoriteResponse {
    status: {
        code: string;
        message: string;
    };
    data: {
        message: string;
        timestamp: string;
    };
}

export interface ErrorResponse {
    status: {
        code: string;
        message: string;
        additionalInfo?: Record<string, any>;
    };
    error: {
        code: string;
        message: string;
        details?: string;
    };
}

// Instancia de axios con configuración común
const favoritesApiClient = axios.create({
    baseURL: FAVORITES_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a las solicitudes
favoritesApiClient.interceptors.request.use(
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

const favoritesService = {
    /**
     * Obtener todos los favoritos (solo para administradores)
     * @returns Lista de todos los favoritos
     */
    getAllFavorites: async (): Promise<FavoritesListResponse> => {
        try {
            const response = await favoritesApiClient.get('/v1/favorites');
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    },

    /**
     * Obtener favoritos por cliente
     * @param customerId ID del cliente
     * @returns Lista de favoritos del cliente
     */
    getFavoritesByCustomer: async (customerId: string): Promise<FavoritesListResponse> => {
        try {
            const response = await favoritesApiClient.get(`/favorites/customer/${customerId}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    },

    /**
     * Crear un nuevo favorito para un cliente
     * @param customerId ID del cliente
     * @param favoriteData Datos del favorito a crear
     * @returns Información del favorito creado
     */
    createFavorite: async (customerId: string, favoriteData: FavoriteCreateRequest): Promise<FavoriteResponse> => {
        try {
            // Agregamos un ID de referencia único para esta operación (para trazabilidad)
            const referenceId = `FAV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().slice(0, 6)}`;

            const response = await favoritesApiClient.post(
                `/favorites/customer/${customerId}`,
                {
                    ...favoriteData,
                    referenceId, // Esto es opcional pero ayuda para el seguimiento
                }
            );

            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    },

    /**
     * Eliminar un favorito de un cliente
     * @param customerId ID del cliente
     * @param favoriteId ID del favorito
     * @returns Respuesta de la operación
     */
    deleteFavorite: async (customerId: string, favoriteId: string): Promise<DeleteFavoriteResponse> => {
        try {
            const response = await favoritesApiClient.delete(
                `/favorites/customer/${customerId}/favorite/${favoriteId}`
            );

            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    }
};

export default favoritesService;