// src/pages/ProductDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Spinner from '@components/ui/Spinner';
import Alert from '@components/ui/Alert';
import TransferModal from '@components/modals/TransferModal';
import LoanPaymentModal from '@components/modals/LoanPaymentModal';
import productService from '@services/productService';
import { TransferResponse } from '@services/transferService';
import { LoanPaymentResponse } from '@services/loanPaymentService';
import { BalanceData, FixedTermAccountData, LoanBalanceData, Product } from '@/types/products';

// Interfaz de parámetros para useParams
interface ProductDetailParams {
    productId: string;
}

// Interfaz para el estado de la ubicación
interface LocationState {
    productType?: string;
}

// Tipo unión para los diferentes tipos de productos
type ProductDetailData = BalanceData | FixedTermAccountData | LoanBalanceData;

const ProductDetail: React.FC = () => {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const { productId } = useParams<keyof ProductDetailParams>() as ProductDetailParams;
    const location = useLocation();
    const locationState = location.state as LocationState;
    const navigate = useNavigate();

    // Estados para el producto y carga
    const [productDetail, setProductDetail] = useState<ProductDetailData | null>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);

    // Estados para la funcionalidad de transferencia
    const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
    const [isLoadingTransferModal, setIsLoadingTransferModal] = useState<boolean>(false);

    // Estados para la funcionalidad de pago de préstamos
    const [isLoanPaymentModalOpen, setIsLoanPaymentModalOpen] = useState<boolean>(false);
    const [isLoadingLoanPaymentModal, setIsLoadingLoanPaymentModal] = useState<boolean>(false);

    const [products, setProducts] = useState<Product[]>([]);

    // Obtener el tipo de producto del estado
    const productType = locationState?.productType || '';

    // Función para cargar la lista de productos para transferencia
    const fetchProducts = async (): Promise<void> => {
        if (!user) return;

        try {
            const customerIdFromUser = user.attributes?.["custom:customerid"];
            if (customerIdFromUser) {
                // Guardar el customerId en el estado
                setCustomerId(customerIdFromUser);

                const response = await productService.getCustomerProducts(customerIdFromUser);
                if (response && response.data && Array.isArray(response.data.products)) {
                    setProducts(response.data.products);
                }
            } else {
                setError('No se encontró el ID de cliente. Por favor, contacte con soporte.');
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            setError('No se pudieron cargar las cuentas disponibles');
        }
    };

    // Funciones para manejar la apertura/cierre del modal de transferencias
    const handleOpenTransferModal = async (): Promise<void> => {
        // Validar que tenemos un customerId
        if (!customerId) {
            setError('No se encontró el ID de cliente. Por favor, actualice la página o contacte con soporte.');
            return;
        }

        setIsLoadingTransferModal(true);

        try {
            // Si aún no tenemos productos, los cargamos
            if (products.length === 0) {
                await fetchProducts();
            }

            // Ahora que los productos están cargados, abrimos el modal
            setIsTransferModalOpen(true);
        } catch (err) {
            console.error('Error al preparar el modal de transferencia:', err);
            setError('No se pudieron cargar las cuentas para transferencia. Inténtelo de nuevo.');
        } finally {
            setIsLoadingTransferModal(false);
        }
    };

    const handleCloseTransferModal = (): void => {
        setIsTransferModalOpen(false);
    };

    const handleTransferSuccess = (response: TransferResponse): void => {
        // Recargar los detalles del producto después de una transferencia exitosa
        console.log(response);
        setTimeout(() => {
            if (productId && productType) {
                void fetchProductDetail();
            }
        }, 1000);
    };

    // Funciones para manejar la apertura/cierre del modal de pagos de préstamos
    const handleOpenLoanPaymentModal = async (): Promise<void> => {
        // Validar que tenemos un customerId
        if (!customerId) {
            setError('No se encontró el ID de cliente. Por favor, actualice la página o contacte con soporte.');
            return;
        }

        setIsLoadingLoanPaymentModal(true);

        try {
            // Si aún no tenemos productos, los cargamos
            if (products.length === 0) {
                await fetchProducts();
            }

            // Ahora que los productos están cargados, abrimos el modal
            setIsLoanPaymentModalOpen(true);
        } catch (err) {
            console.error('Error al preparar el modal de pago:', err);
            setError('No se pudieron cargar las cuentas para pago. Inténtelo de nuevo.');
        } finally {
            setIsLoadingLoanPaymentModal(false);
        }
    };

    const handleCloseLoanPaymentModal = (): void => {
        setIsLoanPaymentModalOpen(false);
    };

    const handleLoanPaymentSuccess = (response: LoanPaymentResponse): void => {
        // Recargar los detalles del producto después de un pago exitoso
        console.log(response);
        setTimeout(() => {
            if (productId && productType) {
                void fetchProductDetail();
            }
        }, 1000);
    };

    // Cargar los productos una vez al iniciar
    useEffect(() => {
        if (isAuthenticated && user) {
            void fetchProducts();
        }
    }, [isAuthenticated, user]);

    const fetchProductDetail = async (): Promise<void> => {
        if (!productId) return;

        setIsLoadingDetail(true);
        setError(null);

        try {
            // Llamar a la API correspondiente según el tipo de producto
            if (productType === 'SAVINGS' || productType === 'DEPOSIT') {
                const response = await productService.getSavingAccountBalance(productId);
                if (response && response.data) {
                    setProductDetail(response.data as BalanceData);
                }
            } else if (productType === 'FIXED_TERM') {
                const response = await productService.getFixedTermAccount(productId);
                if (response && response.data) {
                    setProductDetail(response.data as FixedTermAccountData);
                }
            } else if (productType === 'CREDIT') {
                const response = await productService.getLoanBalance(productId);
                if (response && response.data) {
                    setProductDetail(response.data as LoanBalanceData);
                }
            } else {
                setError('Tipo de producto no soportado');
            }
        } catch (err) {
            console.error('Error al cargar detalles del producto:', err);

            // Manejo tipado seguro del error
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === 'object' && err !== null) {
                const errorObj = err as Record<string, any>;
                setError(
                    errorObj.response?.data?.status?.message ||
                    errorObj.message ||
                    'Error al cargar los detalles del producto'
                );
            } else {
                setError('Error al cargar los detalles del producto');
            }
        } finally {
            setIsLoadingDetail(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && productId && productType) {
            void fetchProductDetail();
        }
    }, [isAuthenticated, productId, productType]);

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated && !isLoading) {
        return <Navigate to="/login" replace />;
    }

    // Mostrar cargando mientras verifica autenticación
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Spinner size="lg" className="mb-4" />
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    // Funciones para verificar tipo de producto
    const isSavingsAccount = (data: ProductDetailData | null): data is BalanceData => {
        return data !== null && 'availableBalance' in data && 'currentBalance' in data;
    };

    const isFixedTermAccount = (data: ProductDetailData | null): data is FixedTermAccountData => {
        return data !== null && 'startDate' in data && 'maturityDate' in data;
    };

    const isLoanAccount = (data: ProductDetailData | null): data is LoanBalanceData => {
        return data !== null && 'loanId' in data && 'principalBalance' in data;
    };

    // Formatear moneda con tipo seguro
    const formatCurrency = (amount: number, currency: string): string => {
        return new Intl.NumberFormat('es-PA', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Función para renderizar los detalles según el tipo de producto
    const renderProductDetail = () => {
        if (!productDetail) return null;

        if (isSavingsAccount(productDetail)) {
            return (
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-white shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Cuenta</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">ID de Cuenta:</span>
                                <span className="font-medium">{productDetail.accountId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tipo de Cuenta:</span>
                                <span className="font-medium">
                                    {productDetail.accountType === 'SAVINGS' ? 'Cuenta de Ahorro' : 'Cuenta Corriente'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Moneda:</span>
                                <span className="font-medium">{productDetail.currency}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Última Actualización:</span>
                                <span className="font-medium">
                                    {new Date(productDetail.lastUpdateDateTime).toLocaleString('es-PA')}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Saldos</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Saldo Disponible:</span>
                                <span className="font-medium text-primary-700">
                                    {formatCurrency(productDetail.availableBalance, productDetail.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Saldo Actual:</span>
                                <span className="font-medium">
                                    {formatCurrency(productDetail.currentBalance, productDetail.currency)}
                                </span>
                            </div>
                        </div>
                    </Card>
                </div>
            );
        } else if (isFixedTermAccount(productDetail)) {
            return (
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-white shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Depósito</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">ID de Depósito:</span>
                                <span className="font-medium">{productDetail.accountId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tipo:</span>
                                <span className="font-medium">Depósito a Plazo</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Estado:</span>
                                <span className={`font-medium ${
                                    productDetail.status === 'ACTIVE' ? 'text-green-600' :
                                        productDetail.status === 'MATURED' ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                    {productDetail.status === 'ACTIVE' ? 'Activo' :
                                        productDetail.status === 'MATURED' ? 'Vencido' : 'Cerrado'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Monto:</span>
                                <span className="font-medium text-primary-700">
                                    {formatCurrency(productDetail.balance, productDetail.currency)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Condiciones</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Fecha de Inicio:</span>
                                <span className="font-medium">
                                    {new Date(productDetail.startDate).toLocaleDateString('es-PA')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Fecha de Vencimiento:</span>
                                <span className="font-medium">
                                    {new Date(productDetail.maturityDate).toLocaleDateString('es-PA')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tasa de Interés:</span>
                                <span className="font-medium">{productDetail.interestRate}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Plazo (días):</span>
                                <span className="font-medium">{productDetail.term}</span>
                            </div>
                        </div>
                    </Card>

                    {productDetail.interestDetails && (
                        <Card className="p-4 bg-white shadow-md md:col-span-2">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles de Intereses</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Pago de Intereses:</span>
                                        <span className="font-medium">
                                            {productDetail.interestDetails.interestPayment === 'AT_MATURITY' ? 'Al Vencimiento' :
                                                productDetail.interestDetails.interestPayment === 'MONTHLY' ? 'Mensual' : 'Trimestral'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Próximo Pago de Intereses:</span>
                                        <span className="font-medium">
                                            {new Date(productDetail.interestDetails.nextInterestPaymentDate).toLocaleDateString('es-PA')}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Intereses Ganados:</span>
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(productDetail.interestDetails.interestEarned, productDetail.currency)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Retención Fiscal:</span>
                                        <span className="font-medium">
                                            {formatCurrency(productDetail.interestDetails.withholding, productDetail.currency)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            );
        } else if (isLoanAccount(productDetail)) {
            return (
                <div className="grid md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-white shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Préstamo</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">ID de Préstamo:</span>
                                <span className="font-medium">{productDetail.loanId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tipo de Préstamo:</span>
                                <span className="font-medium">
                                    {productDetail.loanType === 'PERSONAL' ? 'Personal' :
                                        productDetail.loanType === 'MORTGAGE' ? 'Hipotecario' :
                                            productDetail.loanType === 'AUTO' ? 'Automóvil' : 'Empresarial'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Estado:</span>
                                <span className={`font-medium ${
                                    productDetail.loanStatus === 'ACTIVE' ? 'text-green-600' :
                                        productDetail.loanStatus === 'PAID_OFF' ? 'text-blue-600' : 'text-red-600'
                                }`}>
                                    {productDetail.loanStatus === 'ACTIVE' ? 'Activo' :
                                        productDetail.loanStatus === 'PAID_OFF' ? 'Pagado' :
                                            productDetail.loanStatus === 'DEFAULTED' ? 'En Mora' : 'Reestructurado'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tasa de Interés:</span>
                                <span className="font-medium">{productDetail.interestRate}%</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Saldo y Pagos</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Saldo Principal:</span>
                                <span className="font-medium text-primary-700">
                                    {formatCurrency(productDetail.principalBalance, productDetail.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Intereses Pendientes:</span>
                                <span className="font-medium">
                                    {formatCurrency(productDetail.interestBalance, productDetail.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Monto Total Pendiente:</span>
                                <span className="font-medium text-red-600">
                                    {formatCurrency(productDetail.totalAmountDue, productDetail.currency)}
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4 bg-white shadow-md md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximo Pago</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Monto del Próximo Pago:</span>
                                    <span className="font-medium">
                                        {formatCurrency(productDetail.nextPaymentAmount, productDetail.currency)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Fecha de Próximo Pago:</span>
                                    <span className="font-medium">
                                        {new Date(productDetail.nextPaymentDate).toLocaleDateString('es-PA')}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {productDetail.remainingTermMonths !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Plazo Restante (meses):</span>
                                        <span className="font-medium">{productDetail.remainingTermMonths}</span>
                                    </div>
                                )}
                                {productDetail.totalPaidToDate !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Pagado hasta la Fecha:</span>
                                        <span className="font-medium text-green-600">
                                            {formatCurrency(productDetail.totalPaidToDate, productDetail.currency)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }

        return (
            <div className="p-4 bg-gray-100 rounded">
                <p className="text-gray-600">No hay información disponible para este tipo de producto.</p>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header
                isAuthenticated={true}
                username={user?.attributes?.name || user?.username || ''}
                onLogout={logout}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                className="mr-4"
                                onClick={() => navigate('/dashboard')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Volver
                            </Button>
                            <h1 className="text-2xl font-bold text-gray-900">Detalle del Producto</h1>
                        </div>
                        <div>
                            {(productType === 'SAVINGS' || productType === 'DEPOSIT' || productType === 'CREDIT') && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => navigate(`/products/${productId}/movements`, { state: { productType } })}
                                >
                                    Ver Movimientos
                                </Button>
                            )}
                        </div>
                    </div>

                    {error && (
                        <Alert
                            variant="error"
                            className="mb-6"
                            onClose={() => setError(null)}
                        >
                            {error}
                        </Alert>
                    )}

                    {isLoadingDetail ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center">
                            <Spinner size="md" className="mx-auto mb-4" />
                            <p className="text-gray-600">Cargando detalles...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {renderProductDetail()}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(productType === 'SAVINGS' || productType === 'DEPOSIT') && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleOpenTransferModal}
                                        disabled={isLoadingTransferModal}
                                    >
                                        {isLoadingTransferModal ? (
                                            <>
                                                <Spinner size="sm" className="mr-2" />
                                                Cargando cuentas...
                                            </>
                                        ) : 'Realizar Transferencia'}
                                    </Button>
                                )}

                                {productType === 'CREDIT' && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={handleOpenLoanPaymentModal}
                                        disabled={isLoadingLoanPaymentModal}
                                    >
                                        {isLoadingLoanPaymentModal ? (
                                            <>
                                                <Spinner size="sm" className="mr-2" />
                                                Cargando cuentas...
                                            </>
                                        ) : 'Realizar Pago'}
                                    </Button>
                                )}

                                <Button variant="outline" className="w-full">
                                    Descargar Estado de Cuenta
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal de Transferencias - Solo renderizar cuando tenemos productos y customerId */}
            {products.length > 0 && customerId && (
                <TransferModal
                    isOpen={isTransferModalOpen}
                    onClose={handleCloseTransferModal}
                    sourceAccountId={productId}
                    products={products}
                    onSuccess={handleTransferSuccess}
                    customerId={customerId}
                />
            )}

            {/* Modal de Pagos de Préstamos - Solo renderizar cuando tenemos productos y customerId */}
            {products.length > 0 && customerId && (
                <LoanPaymentModal
                    isOpen={isLoanPaymentModalOpen}
                    onClose={handleCloseLoanPaymentModal}
                    loanId={productId}
                    products={products}
                    onSuccess={handleLoanPaymentSuccess}
                    customerId={customerId}
                />
            )}

            <Footer />
        </div>
    );
};

export default ProductDetail;