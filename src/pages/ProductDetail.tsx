import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Alert from '@components/ui/Alert';
import { Product, ProductType, ProductStatus, OwnershipType } from '@/types/products';

// Función para formatear moneda
const formatCurrency = (amount: number, currency = 'USD') => {
    return new Intl.NumberFormat('es-PA', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2
    }).format(amount);
};

// Función para formatear fecha
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-PA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Tipo de dato para detalles específicos según el tipo de producto
type ProductSpecificDetails = {
    [key in ProductType]: {
        title: string;
        fields: { label: string; value: string }[];
    };
};

const ProductDetail: React.FC = () => {
    const { productId } = useParams<{ productId: string }>();
    const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Función para obtener los datos del producto
        const fetchProductDetail = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Simulamos una llamada a la API
                // En un entorno real, aquí iría la llamada a la API
                setTimeout(() => {
                    // Datos de ejemplo para demostración
                    const mockProduct: Product = {
                        productId: productId || 'unknown',
                        productType: ProductType.SAVINGS, // Valor por defecto
                        productName: '',
                        accountNumber: '',
                        balance: 0,
                        currency: 'USD',
                        status: ProductStatus.ACTIVE,
                        ownershipType: OwnershipType.PRIMARY,
                        openDate: new Date().toISOString(),
                        additionalData: {}
                    };

                    // En un entorno real, aquí haríamos una llamada a la API de productos
                    console.log(`Obteniendo detalles para el producto con ID: ${productId}`);

                    // Asignamos datos según el ID del producto
                    switch (productId) {
                        case 'PRD123456':
                            mockProduct.productType = ProductType.SAVINGS;
                            mockProduct.productName = 'Cuenta de Ahorro';
                            mockProduct.accountNumber = '1234567890';
                            mockProduct.balance = 5000.75;
                            mockProduct.additionalData = {
                                interestRate: 2.5,
                                lastInterestDate: '2025-03-15',
                                maxMonthlyWithdrawals: 3,
                                availableWithdrawals: 2
                            };
                            break;
                        case 'PRD234567':
                            mockProduct.productType = ProductType.CREDIT;
                            mockProduct.productName = 'Préstamo Hipotecario';
                            mockProduct.accountNumber = '9876543210';
                            mockProduct.balance = 120000.00;
                            mockProduct.openDate = '2022-01-10';
                            mockProduct.additionalData = {
                                interestRate: 6.5,
                                nextPaymentDate: '2025-05-15',
                                monthlyPayment: 950.25,
                                originalAmount: 150000.00,
                                term: 360,
                                remainingPayments: 302,
                                guaranteeAddress: "Calle Principal 123, Ciudad de Panamá"
                            };
                            break;
                        case 'PRD345678':
                            mockProduct.productType = ProductType.DEPOSIT;
                            mockProduct.productName = 'Cuenta Corriente';
                            mockProduct.accountNumber = '5555666677';
                            mockProduct.balance = 2500.50;
                            mockProduct.openDate = '2023-11-20';
                            mockProduct.additionalData = {
                                checkbookAvailable: true,
                                debitCardNumber: '****4321',
                                overdraftLimit: 500.00
                            };
                            break;
                        case 'PRD456789':
                            mockProduct.productType = ProductType.FIXED_TERM;
                            mockProduct.productName = 'Depósito a Plazo Fijo';
                            mockProduct.accountNumber = '8888999900';
                            mockProduct.balance = 10000.00;
                            mockProduct.openDate = '2024-02-05';
                            mockProduct.additionalData = {
                                interestRate: 3.8,
                                maturityDate: '2025-02-05',
                                term: '12 months',
                                automaticRenewal: true,
                                interestPaymentType: 'Al vencimiento'
                            };
                            break;
                        default:
                            // Producto genérico para ID no reconocido
                            mockProduct.productName = 'Producto desconocido';
                            mockProduct.accountNumber = '0000000000';
                            break;
                    }

                    setProduct(mockProduct);
                    setIsLoading(false);
                }, 1000);

            } catch (err: any) {
                setError(err?.error || 'Error al cargar los detalles del producto. Intente más tarde.');
                setIsLoading(false);
                console.error('Error fetching product details:', err);
            }
        };

        if (isAuthenticated && !authLoading) {
            fetchProductDetail();
        }
    }, [productId, isAuthenticated, authLoading]);

    // Generar detalles específicos según el tipo de producto
    const getProductSpecificDetails = () => {
        if (!product) return null;

        const details: ProductSpecificDetails = {
            [ProductType.SAVINGS]: {
                title: 'Detalles de Cuenta de Ahorro',
                fields: [
                    { label: 'Tasa de interés', value: product.additionalData?.interestRate ? `${product.additionalData.interestRate}%` : 'N/A' },
                    { label: 'Último interés aplicado', value: product.additionalData?.lastInterestDate ? formatDate(product.additionalData.lastInterestDate) : 'N/A' },
                    { label: 'Retiros mensuales disponibles', value: product.additionalData?.availableWithdrawals && product.additionalData?.maxMonthlyWithdrawals ? `${product.additionalData.availableWithdrawals} de ${product.additionalData.maxMonthlyWithdrawals}` : 'N/A' }
                ]
            },
            [ProductType.CREDIT]: {
                title: 'Detalles de Préstamo',
                fields: [
                    { label: 'Monto original', value: product.additionalData?.originalAmount ? formatCurrency(product.additionalData.originalAmount, product.currency) : 'N/A' },
                    { label: 'Tasa de interés', value: product.additionalData?.interestRate ? `${product.additionalData.interestRate}%` : 'N/A' },
                    { label: 'Cuota mensual', value: product.additionalData?.monthlyPayment ? formatCurrency(product.additionalData.monthlyPayment, product.currency) : 'N/A' },
                    { label: 'Próximo pago', value: product.additionalData?.nextPaymentDate ? formatDate(product.additionalData.nextPaymentDate) : 'N/A' },
                    { label: 'Cuotas restantes', value: product.additionalData?.remainingPayments && product.additionalData?.term ? `${product.additionalData.remainingPayments} de ${product.additionalData.term}` : 'N/A' },
                    { label: 'Dirección de garantía', value: product.additionalData?.guaranteeAddress || 'N/A' }
                ]
            },
            [ProductType.DEPOSIT]: {
                title: 'Detalles de Cuenta Corriente',
                fields: [
                    { label: 'Chequera disponible', value: product.additionalData?.checkbookAvailable ? 'Sí' : 'No' },
                    { label: 'Número de tarjeta', value: product.additionalData?.debitCardNumber || 'N/A' },
                    { label: 'Límite de sobregiro', value: product.additionalData?.overdraftLimit ? formatCurrency(product.additionalData.overdraftLimit, product.currency) : 'N/A' }
                ]
            },
            [ProductType.FIXED_TERM]: {
                title: 'Detalles de Depósito a Plazo Fijo',
                fields: [
                    { label: 'Tasa de interés', value: product.additionalData?.interestRate ? `${product.additionalData.interestRate}%` : 'N/A' },
                    { label: 'Plazo', value: product.additionalData?.term ? `${product.additionalData.term}` : 'N/A' },
                    { label: 'Fecha de vencimiento', value: product.additionalData?.maturityDate ? formatDate(product.additionalData.maturityDate) : 'N/A' },
                    { label: 'Renovación automática', value: product.additionalData?.automaticRenewal ? 'Sí' : 'No' },
                    { label: 'Pago de intereses', value: product.additionalData?.interestPaymentType || 'N/A' }
                ]
            }
        };

        return details[product.productType];
    };

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated && !authLoading) {
        navigate('/login', { replace: true });
        return null; // Devolvemos null para evitar el error de tipo en FC
    }

    // Mostrar cargando mientras verifica autenticación
    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full mb-4"></div>
                    <p className="text-gray-600">Cargando información...</p>
                </div>
            </div>
        );
    }

    // Si hay un error o no se encuentra el producto
    if (error || !product) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <Header
                    isAuthenticated={true}
                    username={user?.attributes?.name || user?.username || ''}
                    onLogout={logout}
                />
                <main className="flex-grow container mx-auto px-4 py-8">
                    <div className="bg-white rounded-lg shadow p-6 max-w-3xl mx-auto">
                        <Alert variant="error" className="mb-4">
                            {error || 'No se encontró el producto solicitado.'}
                        </Alert>
                        <div className="text-center mt-4">
                            <Button variant="primary" onClick={() => navigate('/dashboard')}>
                                Volver al Dashboard
                            </Button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    // Función para obtener el color según el tipo de producto
    const getProductColor = () => {
        switch (product.productType) {
            case ProductType.SAVINGS: return 'border-blue-500 text-blue-700';
            case ProductType.CREDIT: return 'border-red-500 text-red-700';
            case ProductType.DEPOSIT: return 'border-green-500 text-green-700';
            case ProductType.FIXED_TERM: return 'border-purple-500 text-purple-700';
            default: return 'border-gray-500 text-gray-700';
        }
    };

    const specificDetails = getProductSpecificDetails();

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header
                isAuthenticated={true}
                username={user?.attributes?.name || user?.username || ''}
                onLogout={logout}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    {/* Navegación de migas de pan */}
                    <div className="flex items-center text-sm mb-6">
                        <Link to="/dashboard" className="text-gray-600 hover:text-primary-600">
                            Dashboard
                        </Link>
                        <svg className="h-4 w-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-800 font-medium">{product.productName}</span>
                    </div>

                    {/* Encabezado del producto */}
                    <div className={`bg-white shadow-md rounded-lg overflow-hidden border-l-4 ${getProductColor()} mb-6`}>
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{product.productName}</h1>
                                    <p className="text-gray-600 mt-1">
                                        {product.accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}
                                    </p>
                                </div>
                                <div className="mt-4 md:mt-0 text-right">
                                    <p className={`text-sm font-medium ${product.status === ProductStatus.ACTIVE ? 'text-green-600' : 'text-red-600'}`}>
                                        {product.status === ProductStatus.ACTIVE ? 'Activo' : 'Inactivo'}
                                    </p>
                                    <p className="text-2xl font-bold mt-1">
                                        {formatCurrency(product.balance, product.currency)}
                                    </p>
                                </div>
                            </div>

                            {/* Acciones rápidas */}
                            <div className="flex flex-wrap gap-3 mt-6">
                                <Link to={`/products/${product.productId}/movements`}>
                                    <Button variant="outline">
                                        Ver movimientos
                                    </Button>
                                </Link>
                                {product.productType === ProductType.CREDIT && (
                                    <Button>Pagar cuota</Button>
                                )}
                                {(product.productType === ProductType.SAVINGS || product.productType === ProductType.DEPOSIT) && (
                                    <Button>Realizar transferencia</Button>
                                )}
                                <Button variant="outline">Estado de cuenta</Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sección de información general */}
                        <Card className="p-6 lg:col-span-2">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                {specificDetails?.title || 'Detalles del Producto'}
                            </h2>
                            <div className="divide-y divide-gray-200">
                                <div className="py-3 grid grid-cols-2">
                                    <span className="text-sm font-medium text-gray-500">Tipo de producto</span>
                                    <span className="text-sm text-gray-900">
                                        {product.productType === ProductType.SAVINGS && 'Cuenta de Ahorro'}
                                        {product.productType === ProductType.CREDIT && 'Préstamo'}
                                        {product.productType === ProductType.DEPOSIT && 'Cuenta Corriente'}
                                        {product.productType === ProductType.FIXED_TERM && 'Depósito a Plazo Fijo'}
                                    </span>
                                </div>
                                <div className="py-3 grid grid-cols-2">
                                    <span className="text-sm font-medium text-gray-500">Fecha de apertura</span>
                                    <span className="text-sm text-gray-900">{formatDate(product.openDate)}</span>
                                </div>
                                <div className="py-3 grid grid-cols-2">
                                    <span className="text-sm font-medium text-gray-500">Titularidad</span>
                                    <span className="text-sm text-gray-900">
                                        {product.ownershipType === OwnershipType.PRIMARY && 'Titular principal'}
                                        {product.ownershipType === OwnershipType.SECONDARY && 'Titular secundario'}
                                        {product.ownershipType === OwnershipType.JOINT && 'Titularidad conjunta'}
                                    </span>
                                </div>

                                {/* Campos específicos según tipo de producto */}
                                {specificDetails?.fields.map((field, index) => (
                                    <div key={index} className="py-3 grid grid-cols-2">
                                        <span className="text-sm font-medium text-gray-500">{field.label}</span>
                                        <span className="text-sm text-gray-900">{field.value}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Sección de información adicional */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Estado actual */}
                            <Card className="p-6">
                                <h3 className="text-md font-medium text-gray-900 mb-4">Estado Actual</h3>
                                <div className="space-y-3">
                                    {product.productType === ProductType.CREDIT && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Próximo pago:</span>
                                                <span className="text-sm font-medium">{formatDate(product.additionalData?.nextPaymentDate || new Date().toISOString())}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Valor de cuota:</span>
                                                <span className="text-sm font-medium">{formatCurrency(product.additionalData?.monthlyPayment || 0, product.currency)}</span>
                                            </div>
                                            <div className="mt-4">
                                                <Button variant="primary" className="w-full">Pagar ahora</Button>
                                            </div>
                                        </>
                                    )}
                                    {product.productType === ProductType.SAVINGS && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Interés acumulado:</span>
                                                <span className="text-sm font-medium">{formatCurrency(125.32, product.currency)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Retiros disponibles:</span>
                                                <span className="text-sm font-medium">{product.additionalData?.availableWithdrawals || 0}</span>
                                            </div>
                                            <div className="mt-4">
                                                <Button variant="primary" className="w-full">Transferir</Button>
                                            </div>
                                        </>
                                    )}
                                    {product.productType === ProductType.DEPOSIT && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Fondos disponibles:</span>
                                                <span className="text-sm font-medium">{formatCurrency(product.balance, product.currency)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Límite de sobregiro:</span>
                                                <span className="text-sm font-medium">{formatCurrency(product.additionalData?.overdraftLimit || 0, product.currency)}</span>
                                            </div>
                                            <div className="mt-4">
                                                <Button variant="primary" className="w-full">Transferir</Button>
                                            </div>
                                        </>
                                    )}
                                    {product.productType === ProductType.FIXED_TERM && (
                                        <>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Fecha de vencimiento:</span>
                                                <span className="text-sm font-medium">{formatDate(product.additionalData?.maturityDate || new Date().toISOString())}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600">Interés a ganar:</span>
                                                <span className="text-sm font-medium">{formatCurrency((product.balance * (product.additionalData?.interestRate || 0)) / 100, product.currency)}</span>
                                            </div>
                                            <div className="mt-4">
                                                <Button variant="outline" className="w-full">Modificar al vencimiento</Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Card>

                            {/* Opciones */}
                            <Card className="p-6">
                                <h3 className="text-md font-medium text-gray-900 mb-4">Opciones</h3>
                                <ul className="space-y-2">
                                    <li>
                                        <Link to={`/products/${product.productId}/movements`} className="flex items-center text-primary-600 hover:text-primary-800">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                            </svg>
                                            Ver movimientos
                                        </Link>
                                    </li>
                                    <li>
                                        <a href="#" className="flex items-center text-primary-600 hover:text-primary-800">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                            </svg>
                                            Descargar estado de cuenta
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" className="flex items-center text-primary-600 hover:text-primary-800">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                            </svg>
                                            Configurar notificaciones
                                        </a>
                                    </li>
                                </ul>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductDetail;