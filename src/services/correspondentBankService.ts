// src/services/correspondentBankService.ts

import axios from 'axios';

// @ts-ignore
const CORRESPONDENT_API_URL: string = import.meta.env.CORRESPONDENT_API_URL || 'https://ka7ku6xc03.execute-api.us-east-1.amazonaws.com/dev/v1';

export interface Bank {
    bankId: string;
    name: string;
    code: string;
    country: string;
    status: string;
    achCode?: string;
    swiftCode?: string;
    description?: string;
    contactInfo?: {
        email?: string;
        phone?: string;
        address?: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface BanksListResponse {
    status: {
        code: string;
        message: string;
    };
    data: {
        banks: Bank[];
        count: number;
    };
}

export interface ProductsListResponse {
    status: {
        code: string;
        message: string;
    };
    data: {
        products: any[]; // Usaría una interfaz Product más detallada en una implementación real
        count: number;
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
const correspondentApiClient = axios.create({
    baseURL: CORRESPONDENT_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a las solicitudes
correspondentApiClient.interceptors.request.use(
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

const correspondentBankService = {
    /**
     * Obtener todos los bancos corresponsales
     * @returns Lista de bancos corresponsales
     */
    getAllBanks: async (): Promise<BanksListResponse> => {
        try {
            const response = await correspondentApiClient.get('/correspondents');
            return response.data;
        } catch (error: any) {
            // Extraer y lanzar el error en el formato adecuado
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    },

    /**
     * Obtener productos de un banco específico
     * @param bankId ID del banco
     * @returns Lista de productos del banco
     */
    getBankProducts: async (bankId: string): Promise<ProductsListResponse> => {
        try {
            const response = await correspondentApiClient.get(`/correspondents/${bankId}/products`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    },

    /**
     * Crear un nuevo banco corresponsal
     * @param bankData Datos del banco a crear
     * @returns Información del banco creado
     */
    createBank: async (bankData: Omit<Bank, 'bankId' | 'createdAt' | 'updatedAt'>) => {
        try {
            const response = await correspondentApiClient.post('/correspondents', bankData);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    },

    /**
     * Eliminar un banco corresponsal
     * @param bankId ID del banco a eliminar
     * @param force Si es true, elimina el banco incluso si tiene productos asociados
     * @returns Respuesta de la operación
     */
    deleteBank: async (bankId: string, force: boolean = false) => {
        try {
            const response = await correspondentApiClient.delete(`/correspondents/${bankId}?force=${force}`);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                throw error.response.data;
            }
            throw error;
        }
    }
};

export default correspondentBankService;