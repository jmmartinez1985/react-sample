// src/services/userService.ts
import axios from 'axios';
import {ChangePasswordRequest, ChangePasswordSuccessResponse, ErrorResponseExtended} from '@/types';

// @ts-ignore
const API_URL: string = import.meta.env.USER_MANAGEMENT_API_URL || 'https://ztgxlfvw1h.execute-api.us-east-1.amazonaws.com/dev/v1';

// Servicio para gestionar las operaciones del usuario
const userService = {
    // Cambiar contraseña
    changePassword: async (changePasswordData: ChangePasswordRequest): Promise<ChangePasswordSuccessResponse> => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                throw new Error('No hay token disponible');
            }

            const response = await axios.post<ChangePasswordSuccessResponse>(
                `${API_URL}/user-management/auth/change-password`,
                changePasswordData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data as ErrorResponseExtended;
            }
            throw {
                status: { code: 'ERROR', message: 'Error al cambiar la contraseña' },
                error: { code: 'UNKNOWN_ERROR', message: 'Error desconocido al cambiar la contraseña' }
            } as ErrorResponseExtended;
        }
    },
};

export default userService;