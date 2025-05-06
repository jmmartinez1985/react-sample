import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Navigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Card from '@components/ui/Card';
import Button from '@components/ui/Button';
import Spinner from '@components/ui/Spinner';
import Alert from '@components/ui/Alert';
import productService from '@services/productService';
import { BalanceData, FixedTermAccountData, LoanBalanceData } from '@/types/products';

const ProductDetail: React.FC = () => {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const { productId } = useParams<{ productId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [productDetail, setProductDetail] = useState<any>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Obtener el tipo de producto del estado
    const productType = location.state?.productType || '';

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated && !isLoading) {
        return <Navigate to="/login" replace />;
    }

    useEffect(() => {
        const fetchProductDetail = async () => {
            if (!productId) return;

            setIsLoadingDetail(true);
            setError(null);

            try {
                // Llamar a la API correspondiente según el tipo de producto
                if (productType === 'SAVINGS' || productType === 'DEPOSIT') {
                    const response = await productService.getSavingAccountBalance(productId);
                    setProductDetail(response.data);
                } else if (productType === 'FIXED_TERM') {
                    const response = await productService.getFixedTermAccount(productId);
                    setProductDetail(response.data);
                } else if (productType === 'CREDIT') {
                    const response = await productService.getLoanBalance(productId);
                    setProductDetail(response.data);
                } else {
                    setError('Tipo de producto no soportado');
                }
            } catch (err: any) {
                console.error('Error al cargar detalles del producto:', err);
                setError(err?.response?.data?.status?.message || 'Error al cargar los detalles del producto');
            } finally {
                setIsLoadingDetail(false);
            }
        };

        if (isAuthenticated && productId && productType) {
            fetchProductDetail();
        }
    }, [isAuthenticated, productId, productType]);

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

    // Renderizar las tarjetas específicas según el tipo de producto
    const renderSavingsAccountDetail = (balanceData: BalanceData) => {
        return (
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4 bg-white shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Cuenta</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">ID de Cuenta:</span>
                            <span className="font-medium">{balanceData.accountId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tipo de Cuenta:</span>
                            <span className="font-medium">
                                {balanceData.accountType === 'SAVINGS' ? 'Cuenta de Ahorro' : 'Cuenta Corriente'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Moneda:</span>
                            <span className="font-medium">{balanceData.currency}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Última Actualización:</span>
                            <span className="font-medium">
                                {new Date(balanceData.lastUpdateDateTime).toLocaleString('es-PA')}
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
                                {balanceData.availableBalance.toLocaleString('es-PA', {
                                    style: 'currency',
                                    currency: balanceData.currency
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Saldo Actual:</span>
                            <span className="font-medium">
                                {balanceData.currentBalance.toLocaleString('es-PA', {
                                    style: 'currency',
                                    currency: balanceData.currency
                                })}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    const renderFixedTermAccountDetail = (fixedTermData: FixedTermAccountData) => {
        return (
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4 bg-white shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Depósito</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">ID de Depósito:</span>
                            <span className="font-medium">{fixedTermData.accountId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tipo:</span>
                            <span className="font-medium">Depósito a Plazo</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Estado:</span>
                            <span className={`font-medium ${
                                fixedTermData.status === 'ACTIVE' ? 'text-green-600' :
                                    fixedTermData.status === 'MATURED' ? 'text-blue-600' : 'text-red-600'
                            }`}>
                                {fixedTermData.status === 'ACTIVE' ? 'Activo' :
                                    fixedTermData.status === 'MATURED' ? 'Vencido' : 'Cerrado'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Monto:</span>
                            <span className="font-medium text-primary-700">
                                {fixedTermData.balance.toLocaleString('es-PA', {
                                    style: 'currency',
                                    currency: fixedTermData.currency
                                })}
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
                                {new Date(fixedTermData.startDate).toLocaleDateString('es-PA')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Fecha de Vencimiento:</span>
                            <span className="font-medium">
                                {new Date(fixedTermData.maturityDate).toLocaleDateString('es-PA')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tasa de Interés:</span>
                            <span className="font-medium">{fixedTermData.interestRate}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Plazo (días):</span>
                            <span className="font-medium">{fixedTermData.term}</span>
                        </div>
                    </div>
                </Card>

                {fixedTermData.interestDetails && (
                    <Card className="p-4 bg-white shadow-md md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles de Intereses</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pago de Intereses:</span>
                                    <span className="font-medium">
                                        {fixedTermData.interestDetails.interestPayment === 'AT_MATURITY' ? 'Al Vencimiento' :
                                            fixedTermData.interestDetails.interestPayment === 'MONTHLY' ? 'Mensual' : 'Trimestral'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Próximo Pago de Intereses:</span>
                                    <span className="font-medium">
                                        {new Date(fixedTermData.interestDetails.nextInterestPaymentDate).toLocaleDateString('es-PA')}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Intereses Ganados:</span>
                                    <span className="font-medium text-green-600">
                                        {fixedTermData.interestDetails.interestEarned.toLocaleString('es-PA', {
                                            style: 'currency',
                                            currency: fixedTermData.currency
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Retención Fiscal:</span>
                                    <span className="font-medium">
                                        {fixedTermData.interestDetails.withholding.toLocaleString('es-PA', {
                                            style: 'currency',
                                            currency: fixedTermData.currency
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Card>
                )}
            </div>
        );
    };

    const renderLoanAccountDetail = (loanData: LoanBalanceData) => {
        return (
            <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4 bg-white shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Información de Préstamo</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">ID de Préstamo:</span>
                            <span className="font-medium">{loanData.loanId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tipo de Préstamo:</span>
                            <span className="font-medium">
                                {loanData.loanType === 'PERSONAL' ? 'Personal' :
                                    loanData.loanType === 'MORTGAGE' ? 'Hipotecario' :
                                        loanData.loanType === 'AUTO' ? 'Automóvil' : 'Empresarial'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Estado:</span>
                            <span className={`font-medium ${
                                loanData.loanStatus === 'ACTIVE' ? 'text-green-600' :
                                    loanData.loanStatus === 'PAID_OFF' ? 'text-blue-600' : 'text-red-600'
                            }`}>
                                {loanData.loanStatus === 'ACTIVE' ? 'Activo' :
                                    loanData.loanStatus === 'PAID_OFF' ? 'Pagado' :
                                        loanData.loanStatus === 'DEFAULTED' ? 'En Mora' : 'Reestructurado'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Tasa de Interés:</span>
                            <span className="font-medium">{loanData.interestRate}%</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 bg-white shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Saldo y Pagos</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Saldo Principal:</span>
                            <span className="font-medium text-primary-700">
                                {loanData.principalBalance.toLocaleString('es-PA', {
                                    style: 'currency',
                                    currency: loanData.currency
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Intereses Pendientes:</span>
                            <span className="font-medium">
                                {loanData.interestBalance.toLocaleString('es-PA', {
                                    style: 'currency',
                                    currency: loanData.currency
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Monto Total Pendiente:</span>
                            <span className="font-medium text-red-600">
                                {loanData.totalAmountDue.toLocaleString('es-PA', {
                                    style: 'currency',
                                    currency: loanData.currency
                                })}
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
                                    {loanData.nextPaymentAmount.toLocaleString('es-PA', {
                                        style: 'currency',
                                        currency: loanData.currency
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Fecha de Próximo Pago:</span>
                                <span className="font-medium">
                                    {new Date(loanData.nextPaymentDate).toLocaleDateString('es-PA')}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {loanData.remainingTermMonths !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Plazo Restante (meses):</span>
                                    <span className="font-medium">{loanData.remainingTermMonths}</span>
                                </div>
                            )}
                            {loanData.totalPaidToDate !== undefined && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Pagado hasta la Fecha:</span>
                                    <span className="font-medium text-green-600">
                                        {loanData.totalPaidToDate.toLocaleString('es-PA', {
                                            style: 'currency',
                                            currency: loanData.currency
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    // Función para renderizar los detalles según el tipo de producto
    const renderProductDetail = () => {
        if (!productDetail) return null;

        if (productType === 'SAVINGS' || productType === 'DEPOSIT') {
            return renderSavingsAccountDetail(productDetail as BalanceData);
        } else if (productType === 'FIXED_TERM') {
            return renderFixedTermAccountDetail(productDetail as FixedTermAccountData);
        } else if (productType === 'CREDIT') {
            return renderLoanAccountDetail(productDetail as LoanBalanceData);
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
                                    <Button variant="outline" className="w-full">
                                        Realizar Transferencia
                                    </Button>
                                )}

                                {productType === 'CREDIT' && (
                                    <Button variant="outline" className="w-full">
                                        Realizar Pago
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

            <Footer />
        </div>
    );
};

export default ProductDetail;