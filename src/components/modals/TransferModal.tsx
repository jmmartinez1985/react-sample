// src/components/modals/TransferModal.tsx

import React, { useState, useEffect } from 'react';
import Modal from '@components/ui/Modal';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Select from '@components/ui/Select';
import Alert from '@components/ui/Alert';
import Spinner from '@components/ui/Spinner';
import useAuth from '@hooks/useAuth';
import transferService, { TransferRequest, TransferResponse } from '@services/transferService';
import correspondentBankService from '@services/correspondentBankService';
import favoritesService, { FavoriteType } from '@services/favoritesService';
import { Product, ProductType } from '@/types/products';

// Definición de tipos
type ModalStep = 'form' | 'confirmation' | 'result';
type TransferType = 'OWN' | 'THIRD_PARTY'; // Tipo para el tipo de transferencia

interface TransferFormData {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: string;
    currency: string;
    reference: string;
    description: string;
    transferType: TransferType; // Tipo de transferencia
    bankId?: string; // Banco destino cuando es transferencia a terceros
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
    mail?: string; // NUEVO: Añadido el campo mail
}

interface Bank {
    bankId: string;
    name: string;
    code: string;
    country: string;
    status: string;
}

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    sourceAccountId?: string;
    products: Product[];
    onSuccess?: (response: TransferResponse) => void;
    customerId?: string; // ID del cliente para consultar/guardar favoritos (opcional)
}

const TransferModal: React.FC<TransferModalProps> = ({
                                                         isOpen,
                                                         onClose,
                                                         sourceAccountId,
                                                         products,
                                                         onSuccess,
                                                         customerId
                                                     }) => {
    useAuth();

    // Estados del formulario
    const [formData, setFormData] = useState<TransferFormData>({
        sourceAccountId: sourceAccountId || '',
        destinationAccountId: '',
        amount: '',
        currency: 'USD',
        reference: '',
        description: '',
        transferType: 'OWN', // Por defecto, transferencia a cuenta propia
        bankId: '',
        destinationName: '', // NUEVO: Inicializar campo nombre destinatario
        mail: '' // NUEVO: Inicializar campo mail
    });

    // Estado para validación de correo
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
    const [transferResult, setTransferResult] = useState<TransferResponse | null>(null);

    // Obtener solo las cuentas de ahorro/corriente que pueden ser usadas para transferencias
    const transferableAccounts = products.filter(product =>
        product.productType === ProductType.SAVINGS ||
        product.productType === ProductType.DEPOSIT
    );

    // Función para validar el formato de correo electrónico
    const validateEmail = (email: string): boolean => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    };

    // Cargar datos iniciales al abrir el modal
    useEffect(() => {
        if (isOpen) {
            // Reiniciar estados
            setStep('form');
            setError(null);
            setEmailError(null);
            setTransferResult(null);
            setFormData({
                sourceAccountId: sourceAccountId || '',
                destinationAccountId: '',
                amount: '',
                currency: 'USD',
                reference: '',
                description: '',
                transferType: 'OWN',
                bankId: '',
                destinationName: '', // NUEVO: Reiniciar
                mail: '' // NUEVO: Reiniciar
            });
            setSelectedFavorite('');
            setSaveFavorite(false);
            setFavoriteName('');

            // Solo cargar bancos al inicio (los favoritos se cargan solo si es THIRD_PARTY)
            fetchBanks();
        }
    }, [isOpen, sourceAccountId]);

    // Efecto para cargar favoritos cuando cambia el tipo de transferencia
    useEffect(() => {
        if (formData.transferType === 'THIRD_PARTY' && customerId) {
            fetchFavorites();
        } else {
            // Limpiar favoritos y banco si es transferencia propia
            setSelectedFavorite('');
            if (formData.transferType === 'OWN') {
                setFormData(prev => ({
                    ...prev,
                    bankId: '',
                    destinationName: '', // NUEVO: Limpiar en transferencia propia
                    mail: '' // NUEVO: Limpiar en transferencia propia
                }));
            }
        }
    }, [formData.transferType, customerId]);

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
            // Filtrar solo favoritos de tipo TRANSFER
            const transferFavorites = response.data.favorites.filter(
                favorite => favorite.favoriteType === 'TRANSFER'
            );
            setFavorites(transferFavorites);
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

        // Si se cambia el tipo de transferencia a OWN, limpiar bankId y favorito
        if (name === 'transferType') {
            setSelectedFavorite('');
            if (value === 'OWN') {
                setFormData(prev => ({
                    ...prev,
                    bankId: '',
                    destinationAccountId: '', // Limpiar cuenta destino para seleccionar desde la lista
                    destinationName: '', // NUEVO: Limpiar en transferencia propia
                    mail: '' // NUEVO: Limpiar en transferencia propia
                }));
            }
        }

        // Si cambia la cuenta de origen, actualizamos la moneda
        if (name === 'sourceAccountId') {
            const selectedAccount = transferableAccounts.find(acc => acc.accountNumber === value);
            if (selectedAccount && selectedAccount.currency) {
                setFormData(prev => ({
                    ...prev,
                    currency: selectedAccount.currency || 'USD'
                }));
            }
        }

        // Limpiar el favorito seleccionado si se cambia manualmente algún campo relevante
        if (name === 'destinationAccountId' || name === 'bankId' || name === 'destinationName' || name === 'mail') {
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
                    destinationAccountId: selected.destinationAccount || '',
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
                favoriteType: 'TRANSFER' as FavoriteType,
                name: favoriteName,
                description: formData.description,
                destinationAccount: formData.destinationAccountId,
                destinationBank: formData.transferType === 'THIRD_PARTY' ? formData.bankId : undefined,
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
        if (!formData.destinationAccountId) {
            setError('Debe seleccionar o ingresar una cuenta de destino');
            return false;
        }
        if (formData.transferType === 'OWN' && formData.sourceAccountId === formData.destinationAccountId) {
            setError('Las cuentas de origen y destino no pueden ser iguales');
            return false;
        }
        if (formData.transferType === 'THIRD_PARTY' && !formData.bankId) {
            setError('Debe seleccionar un banco destino');
            return false;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
            setError('Debe ingresar un monto válido mayor a cero');
            return false;
        }

        // NUEVO: Validaciones para nombre del destinatario y correo
        if (formData.transferType === 'THIRD_PARTY') {
            if (!formData.destinationName.trim()) {
                setError('Debe ingresar el nombre del destinatario');
                return false;
            }

            if (formData.mail && !validateEmail(formData.mail)) {
                setError('El formato del correo electrónico no es válido');
                return false;
            }
        }

        // Validar que la cuenta de origen tenga fondos suficientes
        const sourceAccount = transferableAccounts.find(acc => acc.accountNumber === formData.sourceAccountId);
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

    // Enviar la transferencia
    const handleSubmitTransfer = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const amount = parseFloat(formData.amount);
            if (isNaN(amount)) {
                throw new Error('Monto inválido');
            }

            // Preparar datos para la API
            const transferData: TransferRequest = {
                sourceAccountId: formData.sourceAccountId,
                destinationAccountId: formData.destinationAccountId,
                amount: amount,
                currency: formData.currency,
                reference: formData.reference || undefined,
                description: formData.description || undefined,
                // Añadir información del banco destino si es transferencia a terceros
                destinationBank: formData.transferType === 'THIRD_PARTY' ? formData.bankId : undefined,
                transferType: formData.transferType,
                destinationName: formData.transferType === 'THIRD_PARTY' ? formData.destinationName : undefined, // NUEVO
                mail: formData.transferType === 'THIRD_PARTY' && formData.mail ? formData.mail : undefined, // NUEVO
                metadata: {
                    channel: 'WEB_BANKING',
                    ipAddress: '127.0.0.1',
                    userAgent: navigator.userAgent
                }
            };

            // Llamar al servicio de transferencia
            const response = await transferService.transferFunds(transferData);

            // Guardar el resultado y mostrar el paso final
            setTransferResult(response);
            setStep('result');

            // Notificar éxito si se proporcionó un callback
            if (onSuccess) {
                onSuccess(response);
            }
        } catch (err) {
            console.error('Error al realizar transferencia:', err);

            // Manejar diferentes tipos de errores de manera segura
            if (err instanceof Error) {
                setError(err.message);
            } else if (typeof err === 'object' && err !== null) {
                const errorObj = err as Record<string, any>;
                setError(
                    errorObj.status?.message ||
                    errorObj.message ||
                    'Error al procesar la transferencia. Intente nuevamente.'
                );
            } else {
                setError('Error desconocido al procesar la transferencia');
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
        const account = transferableAccounts.find(acc => acc.accountNumber === accountId);
        if (!account) return 'Cuenta desconocida';

        return `${account.productName || 'Cuenta'} - ${accountId.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}`;
    };

    // Obtener nombre del banco a partir del ID
    const getBankName = (bankId: string): string => {
        const bank = banks.find(b => b.bankId === bankId);
        return bank ? bank.name : 'Banco desconocido';
    };

    // Renderizar el paso del formulario
    const renderFormStep = () => (
        <>
            {/* Tipo de Transferencia - SIEMPRE VISIBLE PRIMERO */}
            <div className="mb-6">
                <label className="block text-lg font-medium text-gray-800 mb-2">Tipo de Transferencia</label>
                <Select
                    name="transferType"
                    value={formData.transferType}
                    onChange={handleInputChange}
                    className="w-full"
                    required
                >
                    <option value="OWN">Cuenta Propia</option>
                    <option value="THIRD_PARTY">Cuenta de Terceros</option>
                </Select>
            </div>

            {/* Cuenta de Origen - SIEMPRE VISIBLE */}
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
                    {transferableAccounts.map(account => (
                        <option key={account.accountNumber} value={account.accountNumber}>
                            {account.productName || 'Cuenta'} - {account.accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}
                            ({formatCurrency(account.balance || 0, account.currency)})
                        </option>
                    ))}
                </Select>
            </div>

            {/* TERCEROS - Selector de Favoritos y Banco */}
            {formData.transferType === 'THIRD_PARTY' && (
                <>
                    {/* Selector de Favoritos */}
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
                                    {favorite.name} {favorite.destinationBank ? `(${getBankName(favorite.destinationBank)})` : '(Cuenta propia)'}
                                </option>
                            ))}
                        </Select>
                        {isLoadingFavorites && <p className="text-sm text-gray-500 mt-1">Cargando favoritos...</p>}
                    </div>

                    {/* Selector de Banco */}
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

            {/* Cuenta de Destino */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.transferType === 'OWN' ? 'Cuenta de Destino' : 'Cuenta del Beneficiario'}
                </label>
                {formData.transferType === 'OWN' ? (
                    <Select
                        name="destinationAccountId"
                        value={formData.destinationAccountId}
                        onChange={handleInputChange}
                        className="w-full"
                        required
                    >
                        <option value="">Seleccione una cuenta</option>
                        {transferableAccounts
                            .filter(account => account.accountNumber !== formData.sourceAccountId)
                            .map(account => (
                                <option key={account.accountNumber} value={account.accountNumber}>
                                    {account.productName || 'Cuenta'} - {account.accountNumber.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}
                                    ({formatCurrency(account.balance || 0, account.currency)})
                                </option>
                            ))}
                    </Select>
                ) : (
                    <Input
                        id="destinationAccountId"
                        type="text"
                        name="destinationAccountId"
                        value={formData.destinationAccountId}
                        onChange={handleInputChange}
                        placeholder="Número de cuenta"
                        className="w-full"
                        required
                    />
                )}
            </div>

            {/* NUEVO: Nombre del Destinatario - Solo visible para transferencias a terceros */}
            {formData.transferType === 'THIRD_PARTY' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Destinatario</label>
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

            {/* NUEVO: Correo Electrónico - Solo visible para transferencias a terceros */}
            {formData.transferType === 'THIRD_PARTY' && (
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                <Input
                    id="referencia"
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleInputChange}
                    placeholder="Transferencia entre cuentas"
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
                    placeholder="Detalles adicionales de la transferencia"
                    maxLength={100}
                    className="w-full"
                />
            </div>

            {/* Opción para guardar como favorito - Solo visible en transferencias a terceros */}
            {formData.transferType === 'THIRD_PARTY' && (
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

            {/* Campo de nombre para favorito (visible solo si es transferencia a terceros y se va a guardar) */}
            {formData.transferType === 'THIRD_PARTY' && saveFavorite && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Favorito</label>
                    <div className="flex space-x-2">
                        <Input
                            id="favoriteName"
                            type="text"
                            value={favoriteName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFavoriteName(e.target.value)}
                            placeholder="Ej: Transferencia a mamá"
                            className="w-full"
                            required
                        />
                        <Button
                            variant="primary"
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
        const sourceAccount = transferableAccounts.find(acc => acc.accountNumber === formData.sourceAccountId);
        const amount = parseFloat(formData.amount);

        return (
            <>
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Confirme los detalles de la transferencia</h3>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Tipo de Transferencia:</span>
                            <span className="text-sm font-medium">
                                {formData.transferType === 'OWN' ? 'Cuenta Propia' : 'Cuenta de Terceros'}
                            </span>
                        </div>

                        {formData.transferType === 'THIRD_PARTY' && (
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
                                {formData.transferType === 'OWN' ? 'Cuenta de Destino:' : 'Cuenta del Beneficiario:'}
                            </span>
                            <span className="text-sm font-medium">
                                {formData.transferType === 'OWN'
                                    ? getAccountDetails(formData.destinationAccountId)
                                    : formData.destinationAccountId.replace(/(\d{4})(\d{4})(\d{2})/, '$1 $2 $3')}
                            </span>
                        </div>

                        {/* NUEVO: Mostrar nombre del destinatario en confirmación */}
                        {formData.transferType === 'THIRD_PARTY' && formData.destinationName && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Nombre del Destinatario:</span>
                                <span className="text-sm font-medium">{formData.destinationName}</span>
                            </div>
                        )}

                        {/* NUEVO: Mostrar correo en confirmación si existe */}
                        {formData.transferType === 'THIRD_PARTY' && formData.mail && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Correo Electrónico:</span>
                                <span className="text-sm font-medium">{formData.mail}</span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Monto a Transferir:</span>
                            <span className="text-sm font-medium text-primary-700">
                                {formatCurrency(amount, formData.currency)}
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
                        Las transferencias no pueden ser revertidas automáticamente.
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
                        onClick={handleSubmitTransfer}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Procesando...
                            </>
                        ) : 'Confirmar Transferencia'}
                    </Button>
                </div>
            </>
        );
    };

    // Renderizar el paso del resultado
    const renderResultStep = () => {
        if (!transferResult) return null;

        const isSuccess = transferResult.status.code === 'SUCCESS';
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
                        {isSuccess ? 'Transferencia Exitosa' : 'Transferencia Fallida'}
                    </h3>
                    <p className="text-gray-600">
                        {transferResult.status.message}
                    </p>
                </div>

                {isSuccess && (
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Número de Recibo:</span>
                                <span className="text-sm font-medium">{transferResult.result.receiptNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">Fecha y Hora:</span>
                                <span className="text-sm font-medium">
                                    {new Date(transferResult.result.transactionDateTime).toLocaleString('es-PA')}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">De Cuenta:</span>
                                <span className="text-sm">{transferResult.result.sourceAccountId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-600">A Cuenta:</span>
                                <span className="text-sm">{transferResult.result.destinationAccountId}</span>
                            </div>
                            {/* NUEVO: Mostrar destinatario en el recibo */}
                            {formData.transferType === 'THIRD_PARTY' && formData.destinationName && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Destinatario:</span>
                                    <span className="text-sm">{formData.destinationName}</span>
                                </div>
                            )}
                            {formData.transferType === 'THIRD_PARTY' && (
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
                                <span className="text-sm text-gray-600">Nuevo Saldo:</span>
                                <span className="text-sm font-medium">
                                    {formatCurrency(transferResult.result.sourceNewBalance, formData.currency)}
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
                step === 'form' ? 'Realizar Transferencia' :
                    step === 'confirmation' ? 'Confirmar Transferencia' :
                        'Resultado de la Transferencia'
            }
            size="md"
        >
            {renderContent()}
        </Modal>
    );
};

export default TransferModal;