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
import { Product, ProductType } from '@/types/products';

// Definición de tipos
type ModalStep = 'form' | 'confirmation' | 'result';

interface LoanPaymentFormData {
    sourceAccountId: string;
    loanId: string;
    amount: string;
    currency: string;
    paymentType: PaymentType;
    reference: string;
    description: string;
}

interface LoanPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    loanId?: string;
    sourceAccountId?: string;
    products: Product[];
    onSuccess?: (response: LoanPaymentResponse) => void;
}

const LoanPaymentModal: React.FC<LoanPaymentModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               loanId,
                                                               sourceAccountId,
                                                               products,
                                                               onSuccess
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
        description: ''
    });

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

    // Reiniciar el formulario cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            setStep('form');
            setError(null);
            setPaymentResult(null);
            setFormData({
                sourceAccountId: sourceAccountId || '',
                loanId: loanId || '',
                amount: '',
                currency: 'USD',
                paymentType: PaymentType.REGULAR,
                reference: '',
                description: ''
            });
        }
    }, [isOpen, sourceAccountId, loanId]);

    // Manejar cambios en los campos del formulario
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

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

            // Preparar datos para la API
            const paymentData: Omit<LoanPaymentRequest, 'transactionId'> = {
                sourceAccountId: formData.sourceAccountId,
                loanId: formData.loanId,
                amount: amount,
                currency: formData.currency,
                paymentType: formData.paymentType,
                reference: formData.reference || undefined,
                description: formData.description || undefined,
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

    // Renderizar el paso del formulario
    const renderFormStep = () => (
        <>
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

            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Préstamo a Pagar</label>
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
            </div>

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
                            <span className="text-sm text-gray-600">Cuenta de Origen:</span>
                            <span className="text-sm font-medium">{getAccountDetails(formData.sourceAccountId)}</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Préstamo a Pagar:</span>
                            <span className="text-sm font-medium">{getLoanDetails(formData.loanId)}</span>
                        </div>

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