import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { Product } from '@/types/products';
import productService from '@/services/productService';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Button from '@components/ui/Button';
import useAuth from '@hooks/useAuth';

const ProductDetail: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProductDetail = async () => {
            if (!productId) return;

            try {
                setIsLoading(true);
                setError(null);
                const data = await productService.getProductDetail(productId);
                setProduct(data);
            } catch (err: any) {
                setError(err?.error || 'Error al obtener detalles del producto');
                console.error('Error fetching product details:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProductDetail();
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

    const handleViewMovements = () => {
        navigate(`/products/${productId}/movements`);
    };

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
                        <div className="p-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-4">
                                {product.productName}
                            </h1>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Información del producto</h2>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Número de producto</p>
                                            <p className="text-gray-900">{product.accountNumber || 'No disponible'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Tipo de producto</p>
                                            <p className="text-gray-900">{product.productType}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Estado</p>
                                            <p className="text-gray-900">{product.status || 'No disponible'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Tipo de titularidad</p>
                                            <p className="text-gray-900">{product.ownershipType}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Fecha de apertura</p>
                                            <p className="text-gray-900">
                                                {product.openDate
                                                    ? new Date(product.openDate).toLocaleDateString('es-PA')
                                                    : 'No disponible'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Información financiera</h2>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Saldo actual</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {product.balance !== undefined
                                                    ? new Intl.NumberFormat('es-PA', {
                                                        style: 'currency',
                                                        currency: product.currency || 'USD'
                                                    }).format(product.balance)
                                                    : 'No disponible'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Moneda</p>
                                            <p className="text-gray-900">{product.currency || 'No disponible'}</p>
                                        </div>
                                        {product.additionalData && Object.entries(product.additionalData).map(([key, value]) => (
                                            <div key={key}>
                                                <p className="text-sm font-medium text-gray-500">
                                                    {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                                </p>
                                                <p className="text-gray-900">
                                                    {typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)
                                                        ? new Date(value).toLocaleDateString('es-PA')
                                                        : String(value)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8">
                                <Button
                                    variant="primary"
                                    onClick={handleViewMovements}
                                >
                                    Ver movimientos
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;