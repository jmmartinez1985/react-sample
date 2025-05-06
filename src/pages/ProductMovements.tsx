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
import { Transaction, LoanPayment, PaginationInfo } from '@/types/products';

const ProductMovements: React.FC = () => {
    const { isAuthenticated, isLoading, user, logout } = useAuth();
    const { productId } = useParams<{ productId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [movements, setMovements] = useState<any[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [isLoadingMovements, setIsLoadingMovements] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const pageSize = 10;

    // Obtener el tipo de producto del estado
    const productType = location.state?.productType || '';

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated && !isLoading) {
        return <Navigate to="/login" replace />;
    }

    useEffect(() => {
        const fetchMovements = async () => {
            if (!productId) return;

            setIsLoadingMovements(true);
            setError(null);

            try {
                // Llamar a la API correspondiente según el tipo de producto
                if (productType === 'SAVINGS' || productType === 'DEPOSIT') {
                    const response = await productService.getAccountTransactions(productId, currentPage, pageSize);
                    setMovements(response.data.transactions || []);
                    setPagination(response.data.pagination || null);
                } else if (productType === 'CREDIT') {
                    const response = await productService.getLoanPaymentsHistory(productId, currentPage, pageSize);
                    setMovements(response.data || []);
                    setPagination(response.pagination || null);
                } else if (productType === 'FIXED_TERM') {
                    setError('Los depósitos a plazo no tienen movimientos disponibles.');
                    setMovements([]);
                } else {
                    setError('Tipo de producto no soportado');
                }
            } catch (err: any) {
                console.error('Error al cargar movimientos:', err);
                setError(err?.response?.data?.status?.message || 'Error al cargar los movimientos del producto');
                setMovements([]);
            } finally {
                setIsLoadingMovements(false);
            }
        };

        if (isAuthenticated && productId && productType) {
            fetchMovements();
        }
    }, [isAuthenticated, productId, productType, currentPage]);

    // Función para cambiar de página
    const handlePageChange = (page: number) => {
        if (page < 1 || (pagination && page > pagination.totalPages)) return;
        setCurrentPage(page);
    };

    // Función segura para formatear cantidades monetarias
    const formatCurrency = (amount: number | undefined | null, currency: string = 'USD') => {
        if (amount === undefined || amount === null) {
            return 'N/A';
        }
        try {
            return amount.toLocaleString('es-PA', {
                style: 'currency',
                currency: currency
            });
        } catch (error) {
            console.error('Error al formatear moneda:', error);
            return `${amount} ${currency}`;
        }
    };

    // Función para renderizar la tabla de movimientos según el tipo de producto
    const renderMovementsTable = () => {
        if (movements.length === 0) {
            return (
                <div className="text-center py-10">
                    <p className="text-gray-600">No se encontraron movimientos para este producto.</p>
                </div>
            );
        }

        if (productType === 'SAVINGS' || productType === 'DEPOSIT') {
            return (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                            <th className="py-3 px-4 text-left">Fecha</th>
                            <th className="py-3 px-4 text-left">Descripción</th>
                            <th className="py-3 px-4 text-right">Monto</th>
                            <th className="py-3 px-4 text-right">Saldo</th>
                        </tr>
                        </thead>
                        <tbody className="text-gray-700">
                        {movements.map((movement: Transaction) => (
                            <tr key={movement.transactionId} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-4">
                                    {movement.transactionDate ? new Date(movement.transactionDate).toLocaleDateString('es-PA') : 'N/A'}
                                </td>
                                <td className="py-3 px-4">{movement.description || 'N/A'}</td>
                                <td className={`py-3 px-4 text-right ${
                                    movement.transactionType === 'DEPOSIT' ||
                                    movement.transactionType === 'TRANSFER_IN' ||
                                    movement.transactionType === 'INTEREST' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {movement.amount !== undefined && (
                                        (movement.transactionType === 'DEPOSIT' ||
                                        movement.transactionType === 'TRANSFER_IN' ||
                                        movement.transactionType === 'INTEREST' ? '+' : '-') +
                                        formatCurrency(movement.amount, movement.currency)
                                    )}
                                </td>
                                <td className="py-3 px-4 text-right font-medium">
                                    {formatCurrency(movement.balance, movement.currency)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            );
        } else if (productType === 'CREDIT') {
            return (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                        <tr className="bg-gray-100 text-gray-600 uppercase text-sm">
                            <th className="py-3 px-4 text-left">Fecha</th>
                            <th className="py-3 px-4 text-left">Método</th>
                            <th className="py-3 px-4 text-right">Principal</th>
                            <th className="py-3 px-4 text-right">Interés</th>
                            <th className="py-3 px-4 text-right">Total</th>
                            <th className="py-3 px-4 text-center">Estado</th>
                        </tr>
                        </thead>
                        <tbody className="text-gray-700">
                        {movements.map((payment: LoanPayment) => (
                            <tr key={payment.paymentId} className="border-b border-gray-200 hover:bg-gray-50">
                                <td className="py-3 px-4">
                                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('es-PA') : 'N/A'}
                                </td>
                                <td className="py-3 px-4">
                                    {payment.paymentMethod === 'BANK_TRANSFER' ? 'Transferencia' :
                                        payment.paymentMethod === 'CREDIT_CARD' ? 'Tarjeta de Crédito' :
                                            payment.paymentMethod === 'DEBIT_CARD' ? 'Tarjeta de Débito' :
                                                payment.paymentMethod === 'CASH' ? 'Efectivo' :
                                                    payment.paymentMethod === 'CHECK' ? 'Cheque' : 'Otro'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    {formatCurrency(payment.principalAmount, payment.currency)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                    {formatCurrency(payment.interestAmount, payment.currency)}
                                </td>
                                <td className="py-3 px-4 text-right font-medium text-green-600">
                                    {formatCurrency(payment.paymentAmount, payment.currency)}
                                </td>
                                <td className="py-3 px-4 text-center">
                                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                        payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                            payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                payment.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {payment.status === 'COMPLETED' ? 'Completado' :
                                          payment.status === 'PENDING' ? 'Pendiente' :
                                              payment.status === 'FAILED' ? 'Fallido' : 'Reversado'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        return null;
    };

    // Renderizar la paginación
    const renderPagination = () => {
        if (!pagination || pagination.totalPages <= 1) return null;

        return (
            <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="flex justify-between flex-1 sm:hidden">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                    >
                        Siguiente
                    </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> a{' '}
                            <span className="font-medium">
                                {Math.min(currentPage * pageSize, pagination.totalRecords)}
                            </span>{' '}
                            de <span className="font-medium">{pagination.totalRecords}</span> resultados
                        </p>
                    </div>
                    <div>
                        <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-l-md border-gray-300"
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <span className="sr-only">Anterior</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </Button>

                            {Array.from({ length: pagination.totalPages }, (_, i) => (
                                <Button
                                    key={i}
                                    variant={currentPage === i + 1 ? 'primary' : 'outline'}
                                    size="sm"
                                    className={`border-gray-300 ${
                                        currentPage === i + 1 ? 'z-10' : ''
                                    }`}
                                    onClick={() => handlePageChange(i + 1)}
                                >
                                    {i + 1}
                                </Button>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-r-md border-gray-300"
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.totalPages}
                            >
                                <span className="sr-only">Siguiente</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </Button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

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

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Header
                isAuthenticated={true}
                username={user?.attributes?.name || user?.username || ''}
                onLogout={logout}
            />

            <main className="flex-grow container mx-auto px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center mb-6">
                        <Button
                            variant="outline"
                            size="sm"
                            className="mr-4"
                            onClick={() => navigate(`/products/${productId}`, { state: { productType } })}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Volver
                        </Button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {productType === 'SAVINGS' || productType === 'DEPOSIT'
                                ? 'Movimientos de Cuenta'
                                : productType === 'CREDIT'
                                    ? 'Historial de Pagos'
                                    : 'Movimientos'}
                        </h1>
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

                    <Card className="mb-6">
                        <div className="p-6 bg-white rounded-lg overflow-hidden">
                            {isLoadingMovements ? (
                                <div className="flex items-center justify-center py-10">
                                    <Spinner size="md" className="mr-3" />
                                    <p>Cargando movimientos...</p>
                                </div>
                            ) : (
                                <>
                                    {renderMovementsTable()}
                                    {renderPagination()}
                                </>
                            )}
                        </div>
                    </Card>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default ProductMovements;