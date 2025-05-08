// src/components/modals/LoanPaymentModal.tsx

import React, { useState, useEffect } from 'react';
import Modal from '@components/ui/Modal';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Select from '@components/ui/Select';
import Alert from '@components/ui/Alert';
import Spinner from '@components/ui/Spinner';
import useAuth from '@hooks/useAuth';
import loanPaymentService, { LoanPaymentRequest, LoanPaymentResponse, PaymentType } from '@services/loanPaymentService';
import correspondentBankService from '@services/correspondentBankService';
import favoritesService, { FavoriteType } from '@services/favoritesService';
import { Product, ProductType } from '@/types/products';

// Definición de tipos
type ModalStep = 'form' | 'confirmation' | 'result';
type PaymentDestinationType = 'OWN' | 'THIRD_PARTY'; // Tipo para el destino del pago

// Valor constante para los tipos de destino de pago (para evitar errores de comparación)
const PAYMENT_DESTINATION = {
    OWN: 'OWN' as PaymentDestinationType,
    THIRD_PARTY: 'THIRD_PARTY' as PaymentDestinationType
};

interface LoanPaymentFormData {
    sourceAccountId: string;
    loanId: string;
    amount: string;
    currency: string;
    paymentType: PaymentType;
    reference: string;
    description: string;
    destinationType: PaymentDestinationType; // Campo para tipo de destino
    bankId?: string; // Campo para banco destino cuando es pago a terceros
    destinationName: string; // NUEVO: Nombre del destinatario
    mail: string; // NUEVO: Correo electrónico del destinatario
}

interface Favorite {
    favoriteId: string;
    favoriteType: string;
    name: string;
    description?: string;
    destinationAccount?: string;
    destinationBank?: string;
    destinationName?: string;
    loanNumber?: string;
    mail?: string; // NUEVO: Añadido el campo mail
}

interface Bank {
    bankId: string;
    name: string;
    code: string;
    country: string;
    status: string;
}

interface LoanPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    loanId?: string;
    sourceAccountId?: string;
    products: Product[];
    onSuccess?: (response: LoanPaymentResponse) => void;
    customerId?: string; // ID del cliente para consultar/guardar favoritos (opcional)
}

const LoanPaymentModal: React.FC<LoanPaymentModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               loanId,
                                                               sourceAccountId,
                                                               products,
                                                               onSuccess,
                                                               customerId
                                                           }) => {
    useAuth();

    // Estados del formulario
    const [formData, setFormData] = useState<LoanPaymentFormData>({
        sourceAccountId: sourceAccountId || '',
        loanId: loanId || '',
        amount: '',
        currency: 'USD',
        paymentType: PaymentType.REGULAR,
        reference: '',
        description: '',
        destinationType: PAYMENT_DESTINATION.OWN, // Por defecto, pago a préstamo propio
        bankId: '',
        destinationName: '', // NUEVO: Inicializar campo nombre destinatario
        mail: '' // NUEVO: Inicializar campo mail
    });

    // NUEVO: Estado para validación de correo
    const [emailError, setEmailError] = useState<string | null>(null);

    // Estados para bancos y favoritos
    const [banks, setBanks] = useState<Bank[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [selectedFavorite, setSelectedFavorite] = useState<string>('');
    const [isLoadingBanks, setIsLoadingBanks] = useState<boolean>(false);
    const [isLoadingFavorites, setIsLoadingFavorites] = useState<boolean>(false);
    const [isSavingFavorite, setIsSavingFavorite] = useState<boolean>(false);
    const [saveFavorite, setSaveFavorite] = useState<boolean>(false);
    const [favoriteName, setFavoriteName] = useState<string>('');

    // Estados para manejo del modal
    const [step, setStep] = useState<ModalStep>('form');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<LoanPaymentResponse | null>(null);

    // Filtrar productos por tipo
    const sourceAccounts = products.filter(product =>
        product.productType === ProductType.SAVINGS ||
        product.productType === ProductType.DEPOSIT
    );

    const loans = products.filter(product =>
        product.productType === ProductType.CREDIT
    );

    // NUEVO: Función para validar el formato de correo electrónico
    const validateEmail = (email: string): boolean => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    // Cargar bancos y favoritos al abrir el modal
    useEffect(() => {
        if (isOpen) {
            setStep('form');
            setError(null);
            setEmailError(null); // Reiniciar error de email
            setPaymentResult(null);

            // Inicializar el formulario según tipo de destino
            const initialDestType = PAYMENT_DESTINATION.OWN; // Siempre empezamos con préstamo propio por defecto

            setFormData({
                sourceAccountId: sourceAccountId || '',
                // Solo establecer loanId si es préstamo propio y se proporciona un ID
                loanId: initialDestType === PAYMENT_DESTINATION.OWN ? (loanId || '') : '',
                amount: '',
                currency: 'USD',
                paymentType: PaymentType.REGULAR,
                reference: '',
                description: '',
                destinationType: initialDestType,
                bankId: '',
                destinationName: '', // Reiniciar
                mail: '' // Reiniciar
            });

            setSelectedFavorite('');
            setSaveFavorite(false);
            setFavoriteName('');

            // Solo cargar bancos y favoritos si es necesario
            if (initialDestType === PAYMENT_DESTINATION.THIRD_PARTY) {
                fetchBanks();
                if (customerId) {
                    fetchFavorites();
                }
            }
        }
    }, [isOpen, sourceAccountId, loanId, customerId]);

    // Efecto para cargar bancos y favoritos cuando cambia el tipo de destino
    useEffect(() => {
        if (formData.destinationType === 'THIRD_PARTY') {
            fetchBanks();
            if (customerId) {
                fetchFavorites();
            }
        }
    }, [formData.destinationType, customerId]);

    // Cargar lista de bancos
    const fetchBanks = async () => {
        try {
            setIsLoadingBanks(true);
            const response = await correspondentBankService.getAllBanks();
            setBanks(response.data.banks.filter(bank => bank.status === 'ACTIVE'));
        } catch (err) {
            console.error('Error al cargar bancos:', err);
            setError('No se pudieron cargar los bancos corresponsales');
        } finally {
            setIsLoadingBanks(false);
        }
    };

    // Cargar lista de favoritos
    const fetchFavorites = async () => {
        if (!customerId) {
            console.log('No se pueden cargar favoritos: ID de cliente no disponible');
            setFavorites([]);
            return;
        }

        try {
            setIsLoadingFavorites(true);
            const response = await favoritesService.getFavoritesByCustomer(customerId);
            // Filtrar solo favoritos de tipo LOAN_PAYMENT
            const loanPaymentFavorites = response.data.favorites.filter(
                favorite => favorite.favoriteType === 'LOAN_PAYMENT'
            );
            setFavorites(loanPaymentFavorites);
        } catch (err) {
            console.error('Error al cargar favoritos:', err);
            setError('No se pudieron cargar los favoritos');
        } finally {
            setIsLoadingFavorites(false);
        }
    };

    // Manejar cambios en los campos del formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // NUEVO: Validación especial para el campo de correo
        if (name === 'mail') {
            if (value && !validateEmail(value)) {
                setEmailError('Por favor, ingrese un correo electrónico válido');
            } else {
                setEmailError(null);
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Manejar cambios en el tipo de destino
        if (name === 'destinationType') {
            if (value === PAYMENT_DESTINATION.OWN) {
                // Si cambia a préstamo propio, limpiar campos de terceros
                setFormData(prev => ({
                    ...prev,
                    bankId: '',
                    destinationName: '', // Limpiar el nombre del destinatario
                    mail: '' // Limpiar el correo electrónico
                }));
                setSelectedFavorite('');
            } else if (value === PAYMENT_DESTINATION.THIRD_PARTY) {
                // Si cambia a terceros, limpiar el campo de préstamo y cargar bancos y favoritos
                setFormData(prev => ({
                    ...prev,
                    loanId: '', // Limpiar el campo de préstamo al cambiar a terceros
                    destinationName: '', // Inicializar en blanco
                    mail: '' // Inicializar en blanco
                }));
                setSelectedFavorite('');
                fetchBanks();
                if (customerId) {
                    fetchFavorites();
                }
            }
        }

        // Si cambia la cuenta de origen, actualizamos la moneda
        if (name === 'sourceAccountId') {
            const selectedAccount = sourceAccounts.find(acc => acc.accountNumber === value);
            if (selectedAccount && selectedAccount.currency) {
                setFormData(prev => ({
                    ...prev,
                    currency: selectedAccount.currency || 'USD'
                }));
            }
        }

        // Limpiar el favorito seleccionado si se cambia manualmente algún campo relevante
        if (name !== 'destinationType' && name !== 'sourceAccountId' && name !== 'paymentType') {
            setSelectedFavorite('');
        }
    };

    // Manejar selección de favorito
    const handleFavoriteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const favoriteId = e.target.value;
        setSelectedFavorite(favoriteId);

        if (favoriteId) {
            const selected = favorites.find(fav => fav.favoriteId === favoriteId);
            if (selected) {
                // Actualizar formulario con datos del favorito
                setFormData(prev => ({
                    ...prev,
                    loanId: selected.loanNumber || '',
                    bankId: selected.destinationBank || '',
                    description: selected.description || prev.description,
                    destinationName: selected.destinationName || '', // NUEVO: Incluir nombre del destinatario
                    mail: selected.mail || '' // NUEVO: Incluir correo electrónico
                }));

                // NUEVO: Resetear error de email si el favorito tiene un email válido
                if (selected.mail && validateEmail(selected.mail)) {
                    setEmailError(null);
                }
            }
        }
    };

    // Crear nuevo favorito
    const handleSaveFavorite = async () => {
        if (!customerId) {
            setError('No se puede guardar como favorito: ID de cliente no disponible');
            return;
        }

        if (!favoriteName.trim()) {
            setError('Debe ingresar un nombre para el favorito');
            return;
        }

        // NUEVO: Validar correo antes de guardar
        if (formData.mail && !validateEmail(formData.mail)) {
            setError('El correo electrónico del favorito no es válido');
            return;
        }

        try {
            setIsSavingFavorite(true);
            const favoriteData = {
                favoriteType: 'LOAN_PAYMENT' as FavoriteType,
                name: favoriteName,
                description: formData.description,
                loanNumber: formData.loanId,
                destinationBank: formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY ? formData.bankId : undefined,
                destinationName: formData.destinationName, // NUEVO: Incluir nombre del destinatario
                mail: formData.mail // NUEVO: Incluir correo electrónico
            };

            await favoritesService.createFavorite(customerId, favoriteData);
            await fetchFavorites(); // Recargar la lista de favoritos
            setSaveFavorite(false);
            setFavoriteName('');
            setError(null);
        } catch (err) {
            console.error('Error al guardar favorito:', err);
            setError('No se pudo guardar el favorito');
        } finally {
            setIsSavingFavorite(false);
        }
    };

    // Validar el formulario antes de enviar
    const validateForm = (): boolean => {
        if (!formData.sourceAccountId) {
            setError('Debe seleccionar una cuenta de origen');
            return false;
        }
        if (!formData.loanId) {
            setError('Debe seleccionar un préstamo a pagar');
            return false;
        }
        if (formData.destinationType === 'THIRD_PARTY' && !formData.bankId) {
            setError('Debe seleccionar un banco destino');
            return false;
        }

        // NUEVO: Validaciones para nombre del destinatario y correo
        if (formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY) {
            if (!formData.destinationName.trim()) {
                setError('Debe ingresar el nombre del destinatario');
                return false;
            }

            if (formData.mail && !validateEmail(formData.mail)) {
                setError('El formato del correo electrónico no es válido');
                return false;
            }
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Debe ingresar un monto válido mayor a cero');
            return false;
        }

        // Validar que la cuenta de origen tenga fondos suficientes
        const sourceAccount = sourceAccounts.find(acc => acc.accountNumber === formData.sourceAccountId);
        if (sourceAccount) {
            const balance = sourceAccount.balance || 0;
            if (balance < amount) {
                setError('Saldo insuficiente en la cuenta de origen');
                return false;
            }
        } else {
            setError('No se encontró la cuenta de origen');
            return false;
        }

        return true;
    };

    // Ir al paso de confirmación
    const handleProceedToConfirmation = () => {
        if (validateForm()) {
            setError(null);
            setStep('confirmation');
        }
    };

    // Cancelar y volver al paso anterior
    const handleBack = () => {
        if (step === 'confirmation') {
            setStep('form');
        } else if (step === 'result') {
            // Si estamos en el resultado, cerramos el modal
            onClose();
        }
    };

    // Enviar el pago
    const handleSubmitPayment = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const amount = parseFloat(formData.amount);
            if (isNaN(amount)) {
                throw new Error('Monto inválido');
            }

            // Generar un ID de transacción único para esta operación
            const transactionId = `LOAN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8)}`;

            // Preparar datos para la API
            const paymentData: LoanPaymentRequest = {
                transactionId,
                sourceAccountId: formData.sourceAccountId,
                loanId: formData.loanId,
                amount: amount,
                currency: formData.currency,
                paymentType: formData.paymentType,
                reference: formData.reference || undefined,
                description: formData.description || undefined,
                // Añadir información del banco destino si es pago a terceros
                destinationBank: formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY ? formData.bankId : undefined,
                destinationType: formData.destinationType,
                destinationName: formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY ? formData.destinationName : undefined, // NUEVO
                mail: formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && formData.mail ? formData.mail : undefined, // NUEVO
                metadata: {
                    channel: 'WEB_BANKING',
                    ipAddress: '127.0.0.1',
                    userAgent: navigator.userAgent
                }
            };

            // Llamar al servicio de pago
            const response = await loanPaymentService.payLoan(paymentData);

            // Guardar el resultado y mostrar el paso final
            setPaymentResult(response);
            setStep('result');

            // Notificar éxito si se proporcionó un callback
            if (onSuccess) {
                onSuccess(response);
            }
        } catch (err) {
            console.error('Error al realizar pago:', err);

            // Manejar diferentes tipos de errores de manera segura
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === 'object' && err !== null) {
                const errorObj = err as Record<string, any>;
                setError(
                    errorObj.status?.message ||
                    errorObj.message ||
                    'Error al procesar el pago. Intente nuevamente.'
                );
            } else {
                setError('Error desconocido al procesar el pago');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Formatear montos de dinero
    const formatCurrency = (amount: number | string, currency: string = 'USD'): string => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numAmount)) return `${currency} 0.00`;

        return new Intl.NumberFormat('es-PA', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(numAmount);
    };

    // Obtener detalles de la cuenta para mostrar
    const getAccountDetails = (accountId: string): string => {
        const account = sourceAccounts.find(acc => acc.accountNumber === accountId);
        if (!account) return 'Cuenta desconocida';

        return `${account.productName || 'Cuenta'} - ${accountId.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}`;
    };

    // Obtener detalles del préstamo para mostrar
    const getLoanDetails = (loanId: string): string => {
        const loan = loans.find(loan => loan.accountNumber === loanId);
        if (!loan) return 'Préstamo desconocido';

        return `${loan.productName || 'Préstamo'} - ${loanId.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}`;
    };

    // Obtener nombre del banco a partir del ID
    const getBankName = (bankId: string): string => {
        const bank = banks.find(b => b.bankId === bankId);
        return bank ? bank.name : 'Banco desconocido';
    };

    // Renderizar el paso del formulario
    const renderFormStep = () => (
        <>
            {/* Tipo de Destino - SIEMPRE APARECE PRIMERO */}
            <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
                <Select
                    name="destinationType"
                    value={formData.destinationType}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                >
                    <option value={PAYMENT_DESTINATION.OWN}>Préstamo Propio</option>
                    <option value={PAYMENT_DESTINATION.THIRD_PARTY}>Préstamo de Terceros</option>
                </Select>
            </div>

            {/* SECCIÓN PARA PAGO A TERCEROS */}
            {formData.destinationType === 'THIRD_PARTY' && (
                <>
                    {/* Selector de Favoritos - Solo para pagos a terceros */}
                    {customerId && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Favoritos</label>
                            <Select
                                name="favorite"
                                value={selectedFavorite}
                                onChange={handleFavoriteSelect}
                                className="w-full"
                            >
                                <option value="">Seleccione un favorito (opcional)</option>
                                {favorites.map(favorite => (
                                    <option key={favorite.favoriteId} value={favorite.favoriteId}>
                                        {favorite.name} {favorite.destinationBank ? `(${getBankName(favorite.destinationBank)})` : ''}
                                    </option>
                                ))}
                            </Select>
                            {isLoadingFavorites && <p className="text-sm text-gray-500 mt-1">Cargando favoritos...</p>}
                            {favorites.length === 0 && !isLoadingFavorites && (
                                <p className="text-sm text-gray-500 mt-1">No tiene favoritos guardados</p>
                            )}
                        </div>
                    )}

                    {/* Selector de banco - Solo para pagos a terceros */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Banco Destino</label>
                        <Select
                            name="bankId"
                            value={formData.bankId}
                            onChange={handleInputChange}
                            className="w-full"
                            required
                        >
                            <option value="">Seleccione un banco</option>
                            {banks.map(bank => (
                                <option key={bank.bankId} value={bank.bankId}>
                                    {bank.name}
                                </option>
                            ))}
                        </Select>
                        {isLoadingBanks && <p className="text-sm text-gray-500 mt-1">Cargando bancos...</p>}
                    </div>
                </>
            )}

            {/* Cuenta de Origen - Siempre visible */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta de Origen</label>
                <Select
                    name="sourceAccountId"
                    value={formData.sourceAccountId}
                    onChange={handleInputChange}
                    disabled={!!sourceAccountId}
                    className="w-full"
                    required
                >
                    <option value="">Seleccione una cuenta</option>
                    {sourceAccounts.map(account => (
                        <option key={account.accountNumber} value={account.accountNumber}>
                            {account.productName || 'Cuenta'} - {account.accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}
                            ({formatCurrency(account.balance || 0, account.currency)})
                        </option>
                    ))}
                </Select>
            </div>

            {/* Préstamo a pagar - Cambia según el tipo */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.destinationType === 'OWN' ? 'Préstamo a Pagar' : 'Préstamo del Beneficiario'}
                </label>
                {formData.destinationType === 'OWN' ? (
                    <Select
                        name="loanId"
                        value={formData.loanId}
                        onChange={handleInputChange}
                        className="w-full"
                        disabled={!!loanId}
                        required
                    >
                        <option value="">Seleccione un préstamo</option>
                        {loans.map(loan => (
                            <option key={loan.accountNumber} value={loan.accountNumber}>
                                {loan.productName || 'Préstamo'} - {loan.accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}
                                ({formatCurrency(loan.balance || 0, loan.currency)})
                            </option>
                        ))}
                    </Select>
                ) : (
                    <Input
                        id="loanId"
                        type="text"
                        name="loanId"
                        value={formData.loanId}
                        onChange={handleInputChange}
                        placeholder="Número de préstamo"
                        className="w-full"
                        required
                    />
                )}
            </div>

            {/* NUEVO: Validaciones para nombre del destinatario y correo */}
            {formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Beneficiario</label>
                    <Input
                        id="destinationName"
                        type="text"
                        name="destinationName"
                        value={formData.destinationName}
                        onChange={handleInputChange}
                        placeholder="Nombre completo del beneficiario"
                        className="w-full"
                        required
                    />
                </div>
            )}

            {/* NUEVO: Correo Electrónico - Solo visible para pagos a terceros */}
            {formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                    <Input
                        id="mail"
                        type="email"
                        name="mail"
                        value={formData.mail}
                        onChange={handleInputChange}
                        placeholder="ejemplo@correo.com"
                        className={`w-full ${emailError ? 'border-red-500' : ''}`}
                    />
                    {emailError && (
                        <p className="text-xs text-red-500 mt-1">{emailError}</p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                    <Input
                        id="amount"
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        min="0.01"
                        step="0.01"
                        required
                        className="w-full"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                    <Input
                        id="currency"
                        type="text"
                        value={formData.currency}
                        disabled
                        className="w-full bg-gray-50"
                    />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago</label>
                <Select
                    name="paymentType"
                    value={formData.paymentType}
                    onChange={handleInputChange}
                    className="w-full"
                >
                    <option value={PaymentType.REGULAR}>Pago Regular</option>
                    <option value={PaymentType.EXTRA}>Pago Extra</option>
                    <option value={PaymentType.SETTLEMENT}>Liquidación Total</option>
                </Select>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <Input
                    id="referencia"
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="Pago de cuota"
                    maxLength={50}
                    className="w-full"
                />
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <Input
                    id="descripcion"
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detalles adicionales del pago"
                    maxLength={100}
                    className="w-full"
                />
            </div>

            {/* Opción para guardar como favorito - Solo para pagos a terceros */}
            {formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && customerId && (
                <div className="mb-4">
                    <div className="flex items-center">
                        <input
                            id="saveFavorite"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded"
                            checked={saveFavorite}
                            onChange={() => setSaveFavorite(!saveFavorite)}
                        />
                        <label htmlFor="saveFavorite" className="ml-2 block text-sm text-gray-700">
                            Guardar como favorito
                        </label>
                    </div>
                </div>
            )}

            {/* Campo de nombre para favorito (visible solo si se va a guardar) */}
            {formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && saveFavorite && customerId && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Favorito</label>
                    <div className="flex space-x-2">
                        <Input
                            id="favoriteName"
                            type="text"
                            value={favoriteName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFavoriteName(e.target.value)}
                            placeholder="Ej: Pago mensual hipoteca"
                            className="w-full"
                            required
                        />
                        <Button
                            variant="secondary"
                            onClick={handleSaveFavorite}
                            disabled={isSavingFavorite || !favoriteName.trim()}
                        >
                            {isSavingFavorite ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Guardando...
                                </>
                            ) : 'Guardar'}
                        </Button>
                    </div>
                </div>
            )}

            {error && (
                <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={onClose}>
                    Cancelar
                </Button>
                <Button variant="primary" onClick={handleProceedToConfirmation}>
                    Continuar
                </Button>
            </div>
        </>
    );

    // Renderizar el paso de confirmación
    const renderConfirmationStep = () => {
        const sourceAccount = sourceAccounts.find(acc => acc.accountNumber === formData.sourceAccountId);
        const amount = parseFloat(formData.amount);

        return (
            <>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Confirme los detalles del pago</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tipo de Pago:</span>
                            <span className="text-sm font-medium">
                                {formData.destinationType === 'OWN' ? 'Préstamo Propio' : 'Préstamo de Terceros'}
                            </span>
                        </div>

                        {formData.destinationType === 'THIRD_PARTY' && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Banco Destino:</span>
                                <span className="text-sm font-medium">{getBankName(formData.bankId || '')}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Cuenta de Origen:</span>
                            <span className="text-sm font-medium">{getAccountDetails(formData.sourceAccountId)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">
                                {formData.destinationType === 'OWN' ? 'Préstamo a Pagar:' : 'Préstamo del Beneficiario:'}
                            </span>
                            <span className="text-sm font-medium">
                                {formData.destinationType === 'OWN'
                                    ? getLoanDetails(formData.loanId)
                                    : formData.loanId.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}
                            </span>
                        </div>

                        {/* NUEVO: Mostrar nombre del beneficiario en confirmación */}
                        {formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && formData.destinationName && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Nombre del Beneficiario:</span>
                                <span className="text-sm font-medium">{formData.destinationName}</span>
                            </div>
                        )}

                        {/* NUEVO: Mostrar correo en confirmación si existe */}
                        {formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && formData.mail && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Correo Electrónico:</span>
                                <span className="text-sm font-medium">{formData.mail}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Monto a Pagar:</span>
                            <span className="text-sm font-medium text-primary-700">
                                {formatCurrency(amount, formData.currency)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tipo de Pago:</span>
                            <span className="text-sm font-medium">
                                {formData.paymentType === PaymentType.REGULAR ? 'Pago Regular' :
                                    formData.paymentType === PaymentType.EXTRA ? 'Pago Extra' : 'Liquidación Total'}
                            </span>
                        </div>

                        {formData.reference && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Referencia:</span>
                                <span className="text-sm">{formData.reference}</span>
                            </div>
                        )}

                        {formData.description && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Descripción:</span>
                                <span className="text-sm">{formData.description}</span>
                            </div>
                        )}

                        {/* Mostrar el nuevo saldo proyectado */}
                        {sourceAccount && (
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-sm text-gray-600">Saldo Disponible Después:</span>
                                <span className="text-sm font-medium">
                                    {formatCurrency(
                                        (sourceAccount.balance || 0) - (isNaN(amount) ? 0 : amount),
                                        sourceAccount.currency || 'USD'
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm text-yellow-700 mb-6">
                    <p>
                        <strong>Importante:</strong> Verifique todos los detalles antes de confirmar.
                        Los pagos no pueden ser revertidos automáticamente.
                    </p>
                </div>

                {error && (
                    <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                    <Button variant="outline" onClick={handleBack} disabled={isLoading}>
                        Volver
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmitPayment}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Procesando...
                            </>
                        ) : 'Confirmar Pago'}
                    </Button>
                </div>
            </>
        );
    };

    // Renderizar el paso del resultado
    const renderResultStep = () => {
        if (!paymentResult) return null;

        const isSuccess = paymentResult.status.code === 'SUCCESS';
        const amount = parseFloat(formData.amount);

        return (
            <>
                <div className={`text-center mb-6 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    {isSuccess ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <h3 className="text-xl font-bold mb-2">
                        {isSuccess ? 'Pago Exitoso' : 'Pago Fallido'}
                    </h3>
                    <p className="text-gray-600">
                        {paymentResult.status.message}
                    </p>
                </div>

                {isSuccess && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Número de Recibo:</span>
                                <span className="text-sm font-medium">{paymentResult.result.receiptNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Fecha y Hora:</span>
                                <span className="text-sm font-medium">
                                    {new Date(paymentResult.result.transactionDateTime).toLocaleString('es-PA')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">De Cuenta:</span>
                                <span className="text-sm">{paymentResult.result.sourceAccountId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">A Préstamo:</span>
                                <span className="text-sm">{paymentResult.result.loanId}</span>
                            </div>
                            {/* NUEVO: Mostrar beneficiario en el recibo */}
                            {formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && formData.destinationName && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Beneficiario:</span>
                                    <span className="text-sm">{formData.destinationName}</span>
                                </div>
                            )}
                            {formData.destinationType === PAYMENT_DESTINATION.THIRD_PARTY && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Banco Destino:</span>
                                    <span className="text-sm">{getBankName(formData.bankId || '')}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Monto:</span>
                                <span className="text-sm font-medium">{formatCurrency(amount, formData.currency)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Nuevo Saldo de Cuenta:</span>
                                <span className="text-sm font-medium">
                                    {formatCurrency(paymentResult.result.sourceNewBalance, formData.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Saldo Restante del Préstamo:</span>
                                <span className="text-sm font-medium">
                                    {formatCurrency(paymentResult.result.remainingLoanBalance, formData.currency)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Próximo Pago:</span>
                                <span className="text-sm font-medium">
                                    {new Date(paymentResult.result.nextPaymentDate).toLocaleDateString('es-PA')} -
                                    {formatCurrency(paymentResult.result.nextPaymentAmount, formData.currency)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-center mt-6">
                    <Button variant="primary" onClick={onClose}>
                        Finalizar
                    </Button>
                </div>
            </>
        );
    };

    // Renderizar el contenido según el paso actual
    const renderContent = () => {
        switch (step) {
            case 'form':
                return renderFormStep();
            case 'confirmation':
                return renderConfirmationStep();
            case 'result':
                return renderResultStep();
            default:
                return null;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={step === 'result' ? onClose : undefined}
            title={
                step === 'form' ? 'Realizar Pago de Préstamo' :
                    step === 'confirmation' ? 'Confirmar Pago de Préstamo' :
                        'Resultado del Pago'
            }
            size="md"
        >
            {renderContent()}
        </Modal>
    );
};

export default LoanPaymentModal;