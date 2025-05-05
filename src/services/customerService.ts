// Implementación del nuevo servicio de validación de identificación
// src/services/customerService.ts

import axios from 'axios';

// @ts-ignore
const API_URL: string = import.meta.env.CUSTOMER_API_URL || 'https://be2v6ejpwf.execute-api.us-east-1.amazonaws.com/dev/v1';

const customerService = {
    // Validar identificación del cliente
    validateCustomerIdentification: async (
        identificationType: string,
        identificationNumber: string
    ): Promise<any> => {
        try {
            // Obtener token de autenticación
            const token = localStorage.getItem('access_token');

            // Configurar headers
            const headers = token ? {
                'Authorization': `Bearer ${token}`
            } : {};

            // Hacer la petición a la API para validar la identificación
            const response = await axios.get(
                `${API_URL}/customers/identification/${identificationType}/${identificationNumber}`,
                { headers }
            );

            return response.data;
        } catch (error: any) {
            // Si es error 404, cliente no encontrado
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                throw {
                    error: 'Cliente no encontrado. Por favor visite el centro de atención más cercano o contacte a su oficial de relación.'
                };
            }

            // Otros errores
            throw {
                error: 'Error al validar la identificación del cliente'
            };
        }
    }
};

export default customerService;