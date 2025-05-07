// src/services/loanPaymentService.ts

import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import productService from './productService';
import { Product, ProductType } from '@/types/products';

// @ts-ignore
const LOAN_API_URL: string = import.meta.env.LOAN_API_URL || 'https://zmtfurwns8.execute-api.us-east-1.amazonaws.com/dev/v1';

export enum PaymentType {
    REGULAR = 'REGULAR',
    EXTRA = 'EXTRA',
    SETTLEMENT = 'SETTLEMENT'
}

export interface LoanPaymentRequest {
    sourceAccountId: string;
    loanId: string;
    transactionId: string;
    amount: number;
    currency: string;
    paymentType?: PaymentType;
    reference?: string;
    description?: string;
    metadata?: Record<string, any>;
}

export interface LoanPaymentResponse {
    transactionId: string;
    status: {
        code: string;
        message: string;
        additionalInfo?: Record<string, any>;
    };
    result: {
        sourceAccountId: string;
        loanId: string;
        sourceNewBalance: number;
        remainingLoanBalance: number;
        transactionDateTime: string;
        receiptNumber: string;
        nextPaymentDate: string;
        nextPaymentAmount: number;
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
const loanApiClient = axios.create({
    baseURL: LOAN_API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para agregar el token a las solicitudes
loanApiClient.interceptors.request.use(
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

const loanPaymentService = {
    /**
     * Realiza un pago a un préstamo desde una cuenta
     * @param paymentData Datos del pago
     * @returns Respuesta de la operación
     */
    payLoan: async (paymentData: Omit<LoanPaymentRequest, 'transactionId'>): Promise<LoanPaymentResponse> => {
        try {
            // Generar un ID de transacción único para esta operación
            const transactionId = `TRX-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${uuidv4().slice(0, 6)}`;

            const response = await loanApiClient.post(`/loans/debit-payment`, {
                ...paymentData,
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
     * Obtiene una lista de cuentas disponibles para pago de préstamos
     * @param customerId ID del cliente
     * @returns Lista de cuentas
     */
    getPaymentSourceAccounts: async (customerId: string) => {
        try {
            // Usamos el servicio de productos y filtramos para obtener solo las cuentas válidas
            const productsResponse = await productService.getCustomerProducts(customerId);

            // Filtrar solo las cuentas que pueden usarse para débitos (ahorros y corrientes)
            if (productsResponse && productsResponse.data && productsResponse.data.products) {
                const eligibleAccounts = productsResponse.data.products.filter(
                    (product: Product) => product.productType === ProductType.SAVINGS || product.productType === ProductType.DEPOSIT
                );

                return {
                    data: {
                        accounts: eligibleAccounts
                    }
                };
            }

            // Si no hay productos, devolvemos un arreglo vacío
            return { data: { accounts: [] } };
        } catch (error: any) {
            console.error('Error al obtener cuentas para pago:', error);
            throw error;
        }
    },

    /**
     * Obtiene una lista de préstamos del cliente
     * @param customerId ID del cliente
     * @returns Lista de préstamos
     */
    getCustomerLoans: async (customerId: string) => {
        try {
            // Usamos el servicio de productos y filtramos para obtener solo los préstamos
            const productsResponse = await productService.getCustomerProducts(customerId);

            // Filtrar solo los préstamos
            if (productsResponse && productsResponse.data && productsResponse.data.products) {
                const loans = productsResponse.data.products.filter(
                    (product: Product) => product.productType === ProductType.CREDIT
                );

                return {
                    data: {
                        loans: loans
                    }
                };
            }

            // Si no hay préstamos, devolvemos un arreglo vacío
            return { data: { loans: [] } };
        } catch (error: any) {
            console.error('Error al obtener préstamos:', error);
            throw error;
        }
    },

    /**
     * Verifica si una cuenta tiene fondos suficientes para un pago
     * @param accountId ID de la cuenta
     * @param amount Monto a debitar
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

export default loanPaymentService;