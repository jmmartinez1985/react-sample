import axios, { AxiosInstance } from 'axios';
import { Product, CustomerProductsData, SuccessProductsResponse, ProductMovement } from '@/types/products';
import { setupMockProductService } from '@/utils/mockData';

// Configuración de la API
// @ts-ignore
// const API_URL: string = import.meta.env.VITE_API_URL || 'https://api-dev.banco.com/v1';
// @ts-ignore
const API_URL: string = import.meta.env.CUSTOMER_API_URL || 'https://be2v6ejpwf.execute-api.us-east-1.amazonaws.com/dev/v1';

// @ts-ignore
const USE_MOCK_DATA: boolean = process.env.NODE_ENV === 'development';

// Instancia de axios con configuración común
const apiClient: AxiosInstance = axios.create({
    baseURL: API_URL,
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

// Servicio de productos
// @ts-ignore
// @ts-ignore
let productService = {
    // Obtener productos del cliente
    getCustomerProducts: async (customerId: string): Promise<CustomerProductsData> => {
        try {
            const response = await apiClient.get<SuccessProductsResponse>(
                `/customers/${customerId}/products`
            );
            return response.data.data;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error al obtener productos del cliente' };
        }
    },

    // Obtener detalle de un producto específico
    getProductDetail: async (productId: string): Promise<Product> => {
        try {
            // Esta función simula la obtención del detalle de un producto
            // En una implementación real, se haría una llamada a la API específica
            // Por ahora, obtenemos todos los productos y filtramos
            const customerId = localStorage.getItem('customerId') || '';
            const response = await apiClient.get<SuccessProductsResponse>(
                `/customers/${customerId}/products`
            );

            const product = response.data.data.products.find(
                (p) => p.productId === productId
            );

            if (!product) {
                throw { error: 'Producto no encontrado' };
            }

            return product;
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error al obtener detalles del producto' };
        }
    },

    // Obtener movimientos de un producto
    getProductMovements: async (productId: string): Promise<ProductMovement[]> => {
        try {
            // Esta función simula la obtención de movimientos de un producto
            // En una implementación real, se haría una llamada a la API
            // Por ahora, retornamos un array vacío
            console.log(productId)
            return [];
        } catch (error) {
            if (axios.isAxiosError(error) && error.response) {
                throw error.response.data;
            }
            throw { error: 'Error al obtener movimientos del producto' };
        }
    },
};

// En desarrollo usamos datos de prueba
if (USE_MOCK_DATA) {
    console.log('Usando datos de prueba para el servicio de productos');
    productService = setupMockProductService(productService);
}

export default productService;