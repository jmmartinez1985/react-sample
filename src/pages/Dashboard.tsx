import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import ProductList from '@components/products/ProductList';
import productService from '@/services/productService';
import { Product } from '@/types/products';
import { ProductType, ProductStatus, OwnershipType } from '@/types/products';

const Dashboard: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // En un entorno real, obtenemos el customerId del servicio de autenticación
                // Por ahora, usamos uno fijo para demostración
                const customerId = user?.attributes?.sub || 'CUS123456789';
                localStorage.setItem('customerId', customerId);

                // Intenta obtener los productos
                const customerData = await productService.getCustomerProducts(customerId);
                setProducts(customerData.products);
                setLastUpdate(customerData.lastUpdateDate || new Date().toISOString());
            } catch (err: any) {
                setError(err?.error || 'Error al cargar productos. Intente más tarde.');
                console.error('Error fetching products:', err);

                // Para fines de demostración, cargaremos productos de ejemplo si hay un error
                if (process.env.NODE_ENV === 'development') {
                    loadMockProducts();
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated && !authLoading) {
            fetchProducts();
        }
    }, [isAuthenticated, authLoading, user]);

    // Función para cargar productos de ejemplo en modo desarrollo
    const loadMockProducts = () => {
        const mockProducts: Product[] = [
            {
                productId: 'PRD123456',
                productType: ProductType.SAVINGS,
                productName: 'Cuenta de Ahorro',
                accountNumber: '1234567890',
                balance: 5000.75,
                currency: 'USD',
                status: ProductStatus.ACTIVE,
                ownershipType: OwnershipType.PRIMARY,
                openDate: '2023-05-15',
                additionalData: { interestRate: 2.5, lastInterestDate: '2025-03-15' }
            },
            {
                productId: 'PRD234567',
                productType: ProductType.CREDIT,
                productName: 'Préstamo Hipotecario',
                accountNumber: '9876543210',
                balance: 120000.00,
                currency: 'USD',
                status: ProductStatus.ACTIVE,
                ownershipType: OwnershipType.PRIMARY,
                openDate: '2022-01-10',
                additionalData: { interestRate: 6.5, nextPaymentDate: '2025-05-15', monthlyPayment: 950.25 }
            },
            {
                productId: 'PRD345678',
                productType: ProductType.DEPOSIT,
                productName: 'Cuenta Corriente',
                accountNumber: '5555666677',
                balance: 2500.50,
                currency: 'USD',
                status: ProductStatus.ACTIVE,
                ownershipType: OwnershipType.PRIMARY,
                openDate: '2023-11-20'
            },
            {
                productId: 'PRD456789',
                productType: ProductType.FIXED_TERM,
                productName: 'Depósito a Plazo Fijo',
                accountNumber: '8888999900',
                balance: 10000.00,
                currency: 'USD',
                status: ProductStatus.ACTIVE,
                ownershipType: OwnershipType.PRIMARY,
                openDate: '2024-02-05',
                additionalData: { interestRate: 3.8, maturityDate: '2025-02-05', term: '12 months' }
            }
        ];

        setProducts(mockProducts);
        setLastUpdate(new Date().toISOString());
        setError('Usando datos de demostración');
    };

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated && !authLoading) {
        return <Navigate to="/login" replace />;
    }

    // Mostrar cargando mientras verifica autenticación
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-600">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header
                isAuthenticated={true}
                username={user?.attributes?.name || user?.username || ''}
                onLogout={logout}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Banca en Línea</h1>
                    <p className="text-gray-600">
                        Bienvenido, {user?.attributes?.name || user?.username}
                    </p>
                </div>

                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6">
                        <h2 className="text-lg font-medium text-gray-900">Mis Productos</h2>
                        {lastUpdate && (
                            <p className="text-sm text-gray-500 mt-1 sm:mt-0">
                                Última actualización: {new Date(lastUpdate).toLocaleString('es-PA')}
                            </p>
                        )}
                    </div>

                    <ProductList
                        products={products}
                        isLoading={isLoading}
                        error={error}
                    />
                </div>

                {/* Sección de resumen financiero o widgets que se podrían agregar en el futuro */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Accesos Rápidos</h3>
                        <ul className="divide-y divide-gray-200">
                            <li className="py-2">
                                <a href="#" className="text-primary-600 hover:text-primary-800">
                                    Realizar transferencia
                                </a>
                            </li>
                            <li className="py-2">
                                <a href="#" className="text-primary-600 hover:text-primary-800">
                                    Pagar préstamo
                                </a>
                            </li>
                            <li className="py-2">
                                <a href="#" className="text-primary-600 hover:text-primary-800">
                                    Ver mi perfil
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Últimas Notificaciones</h3>
                        <p className="text-gray-600 text-sm">
                            No hay notificaciones nuevas.
                        </p>
                    </div>

                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Contacto</h3>
                        <div className="text-sm">
                            <p className="text-gray-600 mb-2">
                                <span className="font-medium">Teléfono:</span> +507 300-2100
                            </p>
                            <p className="text-gray-600 mb-2">
                                <span className="font-medium">Email:</span> servicio@lahipotecaria.com
                            </p>
                            <p className="text-gray-600">
                                <span className="font-medium">Horario:</span> Lunes a Viernes de 8:00 AM a 5:00 PM
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Dashboard;