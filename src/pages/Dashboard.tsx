// src/pages/Dashboard.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';
import Button from '@components/ui/Button';
import Card from '@components/ui/Card';
import Spinner from '@components/ui/Spinner';
import Alert from '@components/ui/Alert';
import TransferModal from '@components/modals/TransferModal';
import LoanPaymentModal from '@components/modals/LoanPaymentModal';
import productService from '@services/productService';
import notificationService from '@services/notificationService';
import { TransferResponse } from '@services/transferService';
import { LoanPaymentResponse } from '@services/loanPaymentService';
import { Product, ProductType } from '@/types/products';
import { User } from '@/types';

// Definición de interfaces para props
interface ProfileSummaryProps {
    user: User | null;
    onViewProfile: () => void;
}

// Componente para mostrar un resumen del perfil del usuario
const ProfileSummary: React.FC<ProfileSummaryProps> = ({ user, onViewProfile }) => {
    return (
        <Card className="p-4 mb-6 bg-gradient-to-r from-primary-50 to-white">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-lg font-medium text-gray-900">Bienvenido(a), {user?.attributes?.name || user?.username}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Última conexión: {new Date().toLocaleDateString('es-PA')}
                    </p>
                </div>
                <div className="mt-3 md:mt-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewProfile}
                    >
                        Ver mi perfil
                    </Button>
                </div>
            </div>
        </Card>
    );
};

interface ProductCardProps {
    product: Product;
    onViewDetails: (productId: string, productType: string) => void;
    onTransfer: (accountId: string) => void;
    onPayLoan: (loanId: string) => void;
}

// Componente para mostrar un producto financiero en forma de tarjeta
const ProductCard: React.FC<ProductCardProps> = ({ product, onViewDetails, onTransfer, onPayLoan }) => {
    // Función para determinar el color del borde según el tipo de producto
    const getBorderColor = () => {
        switch (product.productType) {
            case ProductType.SAVINGS:
                return 'border-blue-500';
            case ProductType.CREDIT:
                return 'border-red-500';
            case ProductType.DEPOSIT:
                return 'border-green-500';
            case ProductType.FIXED_TERM:
                return 'border-purple-500';
            default:
                return 'border-gray-200';
        }
    };

    // Función para obtener el icono según el tipo de producto
    const getProductIcon = () => {
        switch (product.productType) {
            case ProductType.SAVINGS:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case ProductType.CREDIT:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                );
            case ProductType.DEPOSIT:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case ProductType.FIXED_TERM:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                );
        }
    };

    // Formatear el saldo con separador de miles y dos decimales
    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('es-PA', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Determinar si el saldo es positivo o negativo
    const isPositiveBalance = product.productType === ProductType.CREDIT
        ? (product.balance || 0) <= 0
        : (product.balance || 0) >= 0;

    // Asegurarse de que accountNumber es una cadena de texto para evitar errores
    const formattedAccountNumber = product.accountNumber ?
        product.accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3') :
        'Número de cuenta no disponible';

    return (
        <div className={`border-l-4 ${getBorderColor()} bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg`}>
            <div className="p-5">
                <div className="flex items-start justify-between">
                    <div className="flex items-center">
                        {getProductIcon()}
                        <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">{product.productName || 'Producto'}</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                {formattedAccountNumber}
                            </p>
                        </div>
                    </div>
                    <div className={`text-right ${isPositiveBalance ? 'text-green-600' : 'text-red-600'}`}>
                        <p className="text-lg font-semibold">
                            {formatCurrency(product.balance || 0, product.currency || 'USD')}
                        </p>
                        <p className="text-xs text-gray-500">
                            {product.productType === ProductType.CREDIT ? 'Saldo por pagar' : 'Saldo disponible'}
                        </p>
                    </div>
                </div>

                {/* Información adicional según el tipo de producto */}
                {product.productType === ProductType.CREDIT && product.additionalData && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-gray-500">Tasa de interés</p>
                                <p className="text-sm">{product.additionalData.interestRate || 0}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Próximo pago</p>
                                <p className="text-sm">
                                    {product.additionalData.nextPaymentDate ?
                                        new Date(product.additionalData.nextPaymentDate).toLocaleDateString('es-PA') :
                                        'No disponible'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {product.productType === ProductType.SAVINGS && product.additionalData && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <p className="text-xs text-gray-500">Tasa de interés</p>
                                <p className="text-sm">{product.additionalData.interestRate || 0}%</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Último interés aplicado</p>
                                <p className="text-sm">
                                    {product.additionalData.lastInterestDate ?
                                        new Date(product.additionalData.lastInterestDate).toLocaleDateString('es-PA') :
                                        'No disponible'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewDetails(product.accountNumber, product.productType)}
                        >
                            Detalle
                        </Button>
                    </div>

                    {/* Botón primario según el tipo de producto */}
                    {product.productType === ProductType.CREDIT && (
                        <Button
                            size="sm"
                            onClick={() => onPayLoan(product.accountNumber)}
                        >
                            Pagar
                        </Button>
                    )}
                    {(product.productType === ProductType.SAVINGS || product.productType === ProductType.DEPOSIT) && (
                        <Button
                            size="sm"
                            onClick={() => onTransfer(product.accountNumber)}
                        >
                            Transferir
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Interfaz para las notificaciones
interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    date: string;
    read: boolean;
}

// Hook personalizado para reintentar operaciones después de un error
const useAutoRetry = (
    callback: () => Promise<void>,
    dependencies: any[],
    errorState: string | null,
    retryDelay: number = 5000,
    maxRetries: number = 3
) => {
    const retryCountRef = useRef<number>(0);
    const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isRetryingRef = useRef<boolean>(false);

    // Limpiar el temporizador cuando se desmonte el componente
    useEffect(() => {
        return () => {
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
        };
    }, []);

    // Efecto para manejar reintentos cuando hay un error
    useEffect(() => {
        // Si hay un error y no estamos ya reintentando
        if (errorState && !isRetryingRef.current && retryCountRef.current < maxRetries) {
            console.log(`Error detectado. Reintentando en ${retryDelay / 1000} segundos (Intento ${retryCountRef.current + 1}/${maxRetries})...`);

            isRetryingRef.current = true;

            // Configurar temporizador para reintentar
            retryTimerRef.current = setTimeout(() => {
                retryCountRef.current += 1;
                isRetryingRef.current = false;

                // Ejecutar el callback para reintentar
                callback().catch(() => {
                    // Si falla nuevamente, el efecto se activará otra vez si aún tenemos errorState
                });
            }, retryDelay);
        } else if (!errorState) {
            // Reiniciar el contador de intentos cuando no hay error
            retryCountRef.current = 0;
            isRetryingRef.current = false;

            // Limpiar cualquier temporizador pendiente
            if (retryTimerRef.current) {
                clearTimeout(retryTimerRef.current);
                retryTimerRef.current = null;
            }
        }
    }, [errorState, callback, retryDelay, maxRetries, ...dependencies]);

    return {
        isRetrying: isRetryingRef.current,
        retryCount: retryCountRef.current,
        maxRetries
    };
};

const Dashboard: React.FC = () => {
    const { isAuthenticated, isLoading: authLoading, user, logout } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState<boolean>(false);
    const [autoRetryEnabled, setAutoRetryEnabled] = useState<boolean>(true);
    const [customerId, setCustomerId] = useState<string | undefined>(undefined);

    // Estados para los modales
    const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
    const [isLoanPaymentModalOpen, setIsLoanPaymentModalOpen] = useState<boolean>(false);
    const [selectedSourceAccount, setSelectedSourceAccount] = useState<string | undefined>(undefined);
    const [selectedLoanId, setSelectedLoanId] = useState<string | undefined>(undefined);

    const navigate = useNavigate();

    // Función para cargar productos del cliente
    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Obtener el ID del cliente desde el usuario autenticado
            const customerIdFromUser = user?.attributes?.["custom:customerid"];

            if (!customerIdFromUser) {
                setError("No se encontró el ID de cliente. Por favor, contacte con soporte.");
                setIsLoading(false);
                return;
            }

            // Guardar el customerId en el estado
            setCustomerId(customerIdFromUser);

            // Llamada real a la API usando el servicio
            const response = await productService.getCustomerProducts(customerIdFromUser);

            if (response && response.data && response.data.products) {
                setProducts(response.data.products);
                setLastUpdate(new Date().toISOString());
            } else {
                setProducts([]);
            }

        } catch (err: any) {
            setError(err?.response?.data?.message || 'Error al cargar productos. Intente más tarde.');
            console.error('Error fetching products:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Utilizamos el hook personalizado para reintentar la carga cuando hay errores
    const { isRetrying, retryCount, maxRetries } = useAutoRetry(
        fetchProducts,
        [user],
        autoRetryEnabled ? error : null,
        5000, // 5 segundos
        3     // máximo 3 intentos
    );

    const fetchNotifications = async () => {
        try {
            setIsLoadingNotifications(true);

            // Obtener notificaciones usando un servicio API
            const userId = user?.attributes?.sub;
            if (userId) {
                const response = await notificationService.getUserNotifications(userId);
                if (response && response.data && response.data.notifications) {
                    setNotifications(response.data.notifications);
                }
            }
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
            // Usar notificaciones de ejemplo si la API falla
            setNotifications([
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
                }
            ]);
        } finally {
            setIsLoadingNotifications(false);
        }
    };

    useEffect(() => {
        if (isAuthenticated && !authLoading) {
            fetchProducts();
            fetchNotifications();
        }
    }, [isAuthenticated, authLoading, user]);

    // Función para navegar al detalle del producto
    const handleViewDetails = (productId: string, productType: string) => {
        navigate(`/products/${productId}`, { state: { productType } });
    };

    // Redirección al perfil de usuario
    const handleViewProfile = () => {
        navigate('/profile');
    };

    // Función para refrescar manualmente los datos
    const handleRefresh = () => {
        fetchProducts();
    };

    // Funciones para manejar el modal de transferencias
    const handleOpenTransferModal = (sourceAccountId?: string) => {
        setSelectedSourceAccount(sourceAccountId);
        setIsTransferModalOpen(true);
    };

    const handleCloseTransferModal = () => {
        setIsTransferModalOpen(false);
        setSelectedSourceAccount(undefined);
    };

    const handleTransferSuccess = (response: TransferResponse) => {
        // Actualizar la lista de productos después de una transferencia exitosa
        console.log(response);
        setTimeout(() => {
            fetchProducts();
        }, 1000);
    };

    // Funciones para manejar el modal de pagos de préstamos
    const handleOpenLoanPaymentModal = (loanId?: string, sourceAccountId?: string) => {
        setSelectedLoanId(loanId);
        setSelectedSourceAccount(sourceAccountId);
        setIsLoanPaymentModalOpen(true);
    };

    const handleCloseLoanPaymentModal = () => {
        setIsLoanPaymentModalOpen(false);
        setSelectedLoanId(undefined);
        setSelectedSourceAccount(undefined);
    };

    const handleLoanPaymentSuccess = (response: LoanPaymentResponse) => {
        // Actualizar la lista de productos después de un pago exitoso
        console.log(response);
        setTimeout(() => {
            fetchProducts();
        }, 1000);
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
                    <Spinner size="lg" className="mb-4" />
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
                {/* Resumen de perfil en la parte superior */}
                <ProfileSummary user={user} onViewProfile={handleViewProfile} />

                {/* Sección principal */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-baseline mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Mis Productos Financieros</h2>
                        <div className="flex items-center space-x-4">
                            {lastUpdate && (
                                <p className="text-sm text-gray-500">
                                    Actualizado: {new Date(lastUpdate).toLocaleString('es-PA')}
                                </p>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={isLoading}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refrescar
                            </Button>
                        </div>
                    </div>

                    {/* Mensaje de reintento automático */}
                    {error && isRetrying && (
                        <Alert variant="info" className="mb-4">
                            Reintentando cargar productos automáticamente... Intento {retryCount}/{maxRetries}
                        </Alert>
                    )}

                    {/* Estado de carga */}
                    {isLoading ? (
                        <div className="bg-white rounded-lg p-8 shadow text-center">
                            <Spinner size="md" className="mx-auto mb-4" />
                            <p className="text-gray-600">Cargando sus productos...</p>
                        </div>
                    ) : error ? (
                        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
                            {error}
                            <div className="mt-2 flex space-x-3">
                                <Button size="sm" variant="outline" onClick={handleRefresh}>
                                    Intentar de nuevo
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setAutoRetryEnabled(!autoRetryEnabled)}
                                >
                                    {autoRetryEnabled ? 'Desactivar reintento automático' : 'Activar reintento automático'}
                                </Button>
                            </div>
                        </Alert>
                    ) : products.length === 0 ? (
                        <div className="bg-white rounded-lg p-8 shadow text-center">
                            <p className="text-gray-600 mb-4">No tiene productos financieros asociados.</p>
                            <Button variant="primary">Solicitar un producto</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.productId}
                                    product={product}
                                    onViewDetails={handleViewDetails}
                                    onTransfer={handleOpenTransferModal}
                                    onPayLoan={handleOpenLoanPaymentModal}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Secciones adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Acciones rápidas */}
                    <Card className="p-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Acciones Rápidas</h3>
                        <div className="space-y-3">
                            <button
                                className="w-full flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
                                onClick={() => handleOpenTransferModal()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <span className="text-gray-700">Realizar transferencia</span>
                            </button>
                            <button
                                className="w-full flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors"
                                onClick={() => handleOpenLoanPaymentModal()}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-gray-700">Pagar préstamo</span>
                            </button>
                            <button className="w-full flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-gray-700">Estado de cuenta</span>
                            </button>
                            <button className="w-full flex items-center p-3 rounded-md hover:bg-gray-50 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-gray-700">Ayuda</span>
                            </button>
                        </div>
                    </Card>

                    {/* Notificaciones */}
                    <Card className="p-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Notificaciones</h3>
                        <div className="space-y-3">
                            {isLoadingNotifications ? (
                                <div className="text-center py-4">
                                    <Spinner size="sm" className="mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Cargando notificaciones...</p>
                                </div>
                            ) : notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`p-3 rounded-md ${
                                            notification.type === 'info' ? 'bg-blue-50 border-l-4 border-blue-500' :
                                                notification.type === 'warning' ? 'bg-yellow-50 border-l-4 border-yellow-500' :
                                                    notification.type === 'success' ? 'bg-green-50 border-l-4 border-green-500' :
                                                        notification.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' :
                                                            'bg-gray-50'
                                        }`}
                                    >
                                        <h4 className={`text-sm font-medium ${
                                            notification.type === 'info' ? 'text-blue-800' :
                                                notification.type === 'warning' ? 'text-yellow-800' :
                                                    notification.type === 'success' ? 'text-green-800' :
                                                        notification.type === 'error' ? 'text-red-800' :
                                                            'text-gray-800'
                                        }`}>
                                            {notification.title}
                                        </h4>
                                        <p className={`text-xs mt-1 ${
                                            notification.type === 'info' ? 'text-blue-700' :
                                                notification.type === 'warning' ? 'text-yellow-700' :
                                                    notification.type === 'success' ? 'text-green-700' :
                                                        notification.type === 'error' ? 'text-red-700' :
                                                            'text-gray-600'
                                        }`}>
                                            {notification.message}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No tiene notificaciones nuevas
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Contacto */}
                    <Card className="p-6">
                        <h3 className="text-md font-medium text-gray-900 mb-4">Contacto</h3>
                        <div className="space-y-3">
                            <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Servicio al Cliente</p>
                                    <p className="text-sm text-gray-600">+507 300-2100</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Correo Electrónico</p>
                                    <p className="text-sm text-gray-600">servicio@lahipotecaria.com</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary-600 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Horario de Atención</p>
                                    <p className="text-sm text-gray-600">Lunes a Viernes: 8:00 AM - 5:00 PM</p>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>

            {/* Modal de Transferencias */}
            {customerId && (
                <TransferModal
                    isOpen={isTransferModalOpen}
                    onClose={handleCloseTransferModal}
                    sourceAccountId={selectedSourceAccount}
                    products={products}
                    onSuccess={handleTransferSuccess}
                    customerId={customerId}
                />
            )}

            {/* Modal de Pago de Préstamos */}
            {customerId && (
                <LoanPaymentModal
                    isOpen={isLoanPaymentModalOpen}
                    onClose={handleCloseLoanPaymentModal}
                    loanId={selectedLoanId}
                    sourceAccountId={selectedSourceAccount}
                    products={products}
                    onSuccess={handleLoanPaymentSuccess}
                    customerId={customerId}
                />
            )}

            <Footer />
        </div>
    );
};

export default Dashboard;