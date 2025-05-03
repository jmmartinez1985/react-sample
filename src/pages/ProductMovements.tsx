import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import productService from '@/services/productService';
import { Product, ProductMovement } from '@/types/products';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Button from '@components/ui/Button';
import useAuth from '@hooks/useAuth';

const ProductMovements: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [movements, setMovements] = useState<ProductMovement[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!productId) return;

            try {
                setIsLoading(true);
                setError(null);

                // Obtener detalles del producto
                const productData = await productService.getProductDetail(productId);
                setProduct(productData);

                // Obtener movimientos del producto
                const movementsData = await productService.getProductMovements(productId);
                setMovements(movementsData);
            } catch (err: any) {
                setError(err?.error || 'Error al obtener datos del producto');
                console.error('Error fetching product data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [productId]);

    // Redireccionar si no está autenticado
    if (!isAuthenticated && !authLoading) {
        return <Navigate to="/login" replace />;
    }

    // Mostrar cargando mientras verifica autenticación
    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    const handleBack = () => {
        navigate(-1);
    };

    const formatCurrency = (amount: number, currency?: string): string => {
        return new Intl.NumberFormat('es-PA', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    // Función para mostrar un mensaje cuando no hay movimientos
    const renderEmptyState = () => (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay movimientos registrados</h3>
            <p className="text-gray-600">Este producto no tiene movimientos en el período seleccionado</p>
        </div>
    );

    // Esta función sería para mostrar la tabla de movimientos
    // Por ahora está implementada parcialmente como placeholder
    const renderMovementsTable = () => (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Referencia
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Monto
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Saldo
                    </th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {movements.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="py-8">
                            {renderEmptyState()}
                        </td>
                    </tr>
                ) : (
                    movements.map((movement) => (
                        <tr key={movement.movementId}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                    {new Date(movement.transactionDate).toLocaleDateString('es-PA')}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {new Date(movement.transactionDate).toLocaleTimeString('es-PA')}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="text-sm text-gray-900">{movement.description}</div>
                                {movement.category && (
                                    <div className="text-xs text-gray-500">{movement.category}</div>
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {movement.reference || '—'}
                            </td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                                movement.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {movement.type === 'CREDIT' ? '+' : '-'}
                                {formatCurrency(movement.amount, product?.currency)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                                {formatCurrency(movement.balance, product?.currency)}
                            </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header
                isAuthenticated={true}
                username={user?.attributes?.name || user?.username || ''}
                onLogout={logout}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                <Button
                    variant="outline"
                    size="sm"
                    className="mb-4"
                    onClick={handleBack}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Volver
                </Button>

                {error ? (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">
                                    {error}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : product ? (
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                                        Movimientos
                                    </h1>
                                    <p className="text-gray-600">
                                        {product.productName} • {product.accountNumber || product.productId}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0">
                                    <p className="text-sm text-gray-500">Saldo actual</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {product.balance !== undefined
                                            ? formatCurrency(product.balance, product.currency)
                                            : 'No disponible'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-2 sm:p-4">
                            {/* Aquí se puede agregar un filtro de fechas y categorías en el futuro */}
                            {/* <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                Filtros irían aquí
                            </div> */}

                            {renderMovementsTable()}
                        </div>
                    </div>
                ) : null}
            </main>

            <Footer />
        </div>
    );
};

export default ProductMovements;