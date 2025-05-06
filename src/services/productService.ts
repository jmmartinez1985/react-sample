// src/services/productService.ts

import axios from 'axios';

// @ts-ignore
const CUSTOMER_API_URL: string = import.meta.env.CUSTOMER_API_URL || 'https://be2v6ejpwf.execute-api.us-east-1.amazonaws.com/dev/v1';
// @ts-ignore
const ACCOUNT_API_URL: string = import.meta.env.ACCOUNT_API_URL|| 'https://3v69altpe9.execute-api.us-east-1.amazonaws.com/dev/v1';
// @ts-ignore
const LOAN_API_URL: string = import.meta.env.LOAN_API_URL|| 'https://zmtfurwns8.execute-api.us-east-1.amazonaws.com/dev/v1';

// Instancia de axios con configuración común
const apiClient = axios.create({
    baseURL: CUSTOMER_API_URL,
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

// Función para crear clientes API para diferentes endpoints
const createApiClient = (baseURL: string) => {
    const client = axios.create({
        baseURL,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    client.interceptors.request.use(
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

    return client;
};

const accountApiClient = createApiClient(ACCOUNT_API_URL);
const loanApiClient = createApiClient(LOAN_API_URL);

const productService = {
    // Obtener productos por cliente
    getCustomerProducts: async (customerId: string) => {
        try {
            const response = await apiClient.get(`/customers/${customerId}/products`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener productos del cliente:', error);
            throw error;
        }
    },

    // Obtener saldo de cuenta de ahorro
    getSavingAccountBalance: async (accountId: string) => {
        try {
            const response = await accountApiClient.get(`/accounts/${accountId}/balance`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener saldo de cuenta:', error);
            throw error;
        }
    },

    // Obtener información de depósito a plazo
    getFixedTermAccount: async (accountId: string) => {
        try {
            const response = await accountApiClient.get(`/accounts/deposit-accounts/${accountId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener información de depósito a plazo:', error);
            throw error;
        }
    },

    // Obtener saldo de préstamo
    getLoanBalance: async (loanId: string) => {
        try {
            const response = await loanApiClient.get(`/loans/${loanId}/balance`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener saldo de préstamo:', error);
            throw error;
        }
    },

    // Obtener movimientos de cuenta
    getAccountTransactions: async (accountId: string, page = 1, pageSize = 10) => {
        try {
            const response = await accountApiClient.get(`/accounts/${accountId}/transactions`, {
                params: { page, pageSize }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener movimientos de cuenta:', error);
            throw error;
        }
    },

    // Obtener historial de pagos de préstamo
    getLoanPaymentsHistory: async (loanId: string, page = 1, pageSize = 10) => {
        try {
            const response = await loanApiClient.get(`/loans/${loanId}/payments-history`, {
                params: { page, pageSize }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener historial de pagos de préstamo:', error);
            throw error;
        }
    },
};

export default productService;