// src/services/notificationService.ts
// Interfaz para las notificaciones
interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    date: string;
    read: boolean;
}

// Interfaz para la respuesta de la API
interface NotificationResponse {
    success: boolean;
    data: {
        notifications: Notification[];
    };
    message?: string;
}

// Mock data para las notificaciones
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: '1',
        title: 'Bienvenido a su banca en línea',
        message: 'Hemos renovado nuestra plataforma para mejorar su experiencia.',
        type: 'info',
        date: new Date().toISOString(),
        read: false
    },
    {
        id: '2',
        title: 'Próximo pago de préstamo',
        message: 'Su próximo pago vence el 15/05/2025.',
        type: 'warning',
        date: new Date().toISOString(),
        read: false
    },
    {
        id: '3',
        title: 'Depósito recibido',
        message: 'Ha recibido un depósito de $1,250.00 en su cuenta de ahorros.',
        type: 'success',
        date: new Date(Date.now() - 86400000).toISOString(), // Ayer
        read: true
    },
    {
        id: '4',
        title: 'Actualización de contacto requerida',
        message: 'Por favor actualice su información de contacto en su próxima visita.',
        type: 'info',
        date: new Date(Date.now() - 172800000).toISOString(), // Hace 2 días
        read: false
    }
];

class NotificationService {
    /**
     * Obtiene las notificaciones del usuario
     * @param userId - ID del usuario
     * @returns Promise con la respuesta de notificaciones
     */
    async getUserNotifications(userId: string): Promise<NotificationResponse> {
        // En producción, descomentar esta línea para usar la API real
        console.log(userId)
        // return axios.get(`${API_BASE_URL}/notifications/${userId}`);

        // Simulamos una demora para simular la llamada a la API
        await new Promise(resolve => setTimeout(resolve, 800));

        // Devolvemos los datos mockeados
        return {
            success: true,
            data: {
                notifications: MOCK_NOTIFICATIONS
            }
        };
    }

    /**
     * Marca una notificación como leída
     * @param notificationId - ID de la notificación
     * @returns Promise con la respuesta
     */
    async markAsRead(notificationId: string): Promise<{success: boolean}> {
        // En producción, descomentar esta línea
        // return axios.put(`${API_BASE_URL}/notifications/${notificationId}/read`);
        console.log(notificationId);
        // Simulamos una demora
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true };
    }

    /**
     * Elimina una notificación
     * @param notificationId - ID de la notificación
     * @returns Promise con la respuesta
     */
    async deleteNotification(notificationId: string): Promise<{success: boolean}> {
        // En producción, descomentar esta línea
        // return axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);
        console.log(notificationId)
        // Simulamos una demora
        await new Promise(resolve => setTimeout(resolve, 500));

        return { success: true };
    }
}

// Exportamos una instancia del servicio
const notificationService = new NotificationService();
export default notificationService;