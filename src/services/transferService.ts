// src/services/transferService.ts

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import productService from './productService';
import { Product, ProductType } from '@/types/products';

// @ts-ignore
const ACCOUNT_API_URL: string = import.meta.env.ACCOUNT_API_URL || 'https://3v69altpe9.execute-api.us-east-1.amazonaws.com/dev/v1';

export interface TransferRequest {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    currency: string;
    reference?: string;
    description?: string;
    metadata?: Record<string, any>;
}

export interface TransferResponse {
    transactionId: string;
    status: {
        code: string;
        message: string;
        additionalInfo?: Record<string, any>;
    };
    result: {
        sourceAccountId: string;
        destinationAccountId: string;
        sourceNewBalance: number;
        transactionDateTime: string;
        receiptNumber: string;
    };
}

export interface ErrorResponse {
    status: {
        code: string;
        message: string;
        additionalInfo?: Record<string, any>;
    };
    error: {
        type: string;
        code: string;
        detail: string;
        timestamp: string;
        traceId: string;
    };
}

// Instancia de axios con configuración común
const accountApiClient = axios.create({
    baseURL: ACCOUNT_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a las solicitudes
accountApiClient.interceptors.request.use(
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

const transferService = {
    /**
     * Realiza una transferencia entre cuentas
     * @param transferData Datos de la transferencia
     * @returns Respuesta de la operación
     */
    transferFunds: async (transferData: TransferRequest): Promise<TransferResponse> => {
        try {
            // Generar un ID de transacción único para esta operación
            const transactionId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().slice(0, 6)}`;

            const response = await accountApiClient.post(`/accounts/transfer`, {
                ...transferData,
                transactionId,
            });

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
     * Obtiene una lista de cuentas propias para transferencias
     * @param customerId ID del cliente
     * @returns Lista de cuentas
     */
    getTransferableAccounts: async (customerId: string) => {
        try {
            // Intentamos primero usar el endpoint específico para cuentas transferibles
            try {
                const response = await accountApiClient.get(`/customers/${customerId}/accounts/transferable`);
                return response.data;
            } catch (endpointError) {
                // Si el endpoint específico no existe, usamos el servicio de productos
                // y filtramos para obtener solo las cuentas de ahorro y corrientes
                console.log('Endpoint de cuentas transferibles no disponible, usando servicio de productos');

                const productsResponse = await productService.getCustomerProducts(customerId);

                // Filtrar solo las cuentas que pueden usarse para transferencias
                if (productsResponse && productsResponse.data && productsResponse.data.products) {
                    const transferableProducts = productsResponse.data.products.filter(
                        (product: Product) => product.productType === ProductType.SAVINGS || product.productType === ProductType.DEPOSIT
                    );

                    return {
                        data: {
                            accounts: transferableProducts
                        }
                    };
                }

                // Si no hay productos, devolvemos un arreglo vacío
                return { data: { accounts: [] } };
            }
        } catch (error: any) {
            console.error('Error al obtener cuentas transferibles:', error);
            throw error;
        }
    },

    /**
     * Verifica si una cuenta tiene fondos suficientes para una transferencia
     * @param accountId ID de la cuenta
     * @param amount Monto a transferir
     * @returns True si tiene fondos suficientes, false en caso contrario
     */
    verifyAccountFunds: async (accountId: string, amount: number): Promise<boolean> => {
        try {
            const response = await productService.getSavingAccountBalance(accountId);

            if (response && response.data && response.data.availableBalance) {
                return response.data.availableBalance >= amount;
            }

            return false;
        } catch (error) {
            console.error('Error al verificar fondos de la cuenta:', error);
            throw error;
        }
    }
};

export default transferService;