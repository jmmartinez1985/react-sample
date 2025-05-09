// Tipo de producto bancario
export enum ProductType {
    DEPOSIT = 'DEPOSIT',
    SAVINGS = 'SAVINGS',
    FIXED_TERM = 'FIXED_TERM',
    CREDIT = 'CREDIT'
}

// Estado actual del producto
export enum ProductStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    BLOCKED = 'BLOCKED',
    CLOSED = 'CLOSED'
}

// Tipo de titularidad
export enum OwnershipType {
    PRIMARY = 'PRIMARY',
    SECONDARY = 'SECONDARY',
    JOINT = 'JOINT'
}

// Código de estado de la operación
export enum StatusCode {
    SUCCESS = 'SUCCESS',
    CUSTOMER_NOT_FOUND = 'CUSTOMER_NOT_FOUND',
    NO_PRODUCTS_FOUND = 'NO_PRODUCTS_FOUND',
    INTEGRATION_ERROR = 'INTEGRATION_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
    INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Interfaz para un producto bancario
/*export interface Product {
    productId: string;
    productType: ProductType;
    productName: string;
    accountNumber?: string;
    balance?: number;
    currency?: string;
    status?: ProductStatus;
    ownershipType: OwnershipType;
    openDate?: string;
    additionalData?: Record<string, any>;
}*/

// Interfaz para el estado de la operación
export interface Status {
    code: StatusCode;
    message: string;
    detail?: string;
}

// Interfaz para los datos de productos del cliente
export interface CustomerProductsData {
    customerId: string;
    customerName?: string;
    products: Product[];
    lastUpdateDate?: string;
}

// Interfaz para la respuesta exitosa de productos
export interface SuccessProductsResponse {
    data: CustomerProductsData;
    status: Status;
    timestamp?: string;
    requestId?: string;
}

// Interfaz para la respuesta de error de productos
export interface ErrorProductsResponse {
    status: Status;
    timestamp?: string;
    requestId?: string;
}

// Interfaz para datos adicionales de los productos
export interface ProductAdditionalData {
    [key: string]: any;
    interestRate?: number;
    lastInterestDate?: string;
    maxMonthlyWithdrawals?: number;
    availableWithdrawals?: number;
    nextPaymentDate?: string;
    monthlyPayment?: number;
    originalAmount?: number;
    term?: number | string;
    remainingPayments?: number;
    guaranteeAddress?: string;
    checkbookAvailable?: boolean;
    debitCardNumber?: string;
    overdraftLimit?: number;
    maturityDate?: string;
    automaticRenewal?: boolean;
    interestPaymentType?: string;
}

// Interfaz para movimientos de productos
export interface ProductMovement {
    id: string;
    productId: string;
    date: string;
    description: string;
    amount: number;
    balance: number;
    type: 'DEBIT' | 'CREDIT';
    category?: string;
    reference?: string;
}


// src/types/product.types.ts

export interface Product {
    productId: string;
    productType: string;
    productName: string;
    accountNumber: string;
    balance?: number;
    currency?: string;
    status?: string;
    ownershipType: string;
    openDate?: string;
    additionalData?: any;
}

export interface CustomerProducts {
    customerId: string;
    customerName?: string;
    products: Product[];
    lastUpdateDate?: string;
}

export interface BalanceData {
    accountId: string;
    availableBalance: number;
    currentBalance: number;
    currency: string;
    lastUpdateDateTime: string;
    accountType: string;
}

export interface FixedTermAccountData {
    accountId: string;
    accountType: string;
    balance: number;
    currency: string;
    startDate: string;
    maturityDate: string;
    interestRate: number;
    term: number;
    status: string;
    customer?: CustomerInfo;
    interestDetails?: InterestDetails;
}

export interface CustomerInfo {
    customerId: string;
    name: string;
    documentNumber: string;
    documentType: string;
}

export interface InterestDetails {
    interestPayment: string;
    interestEarned: number;
    nextInterestPaymentDate: string;
    withholding: number;
}

export interface LoanBalanceData {
    loanId: string;
    principalBalance: number;
    interestBalance: number;
    totalAmountDue: number;
    nextPaymentAmount: number;
    nextPaymentDate: string;
    currency: string;
    interestRate: number;
    loanType: string;
    loanStatus: string;
    lastUpdateDateTime: string;
    remainingTermMonths?: number;
    totalPaidToDate?: number;
}

export interface Transaction {
    transactionId: string;
    accountId: string;
    transactionDate: string;
    valueDate: string;
    amount: number;
    currency: string;
    description: string;
    transactionType: string;
    balance: number;
    reference?: string;
}

export interface PaginationInfo {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    nextPage?: string;
    previousPage?: string;
}

export interface LoanPayment {
    paymentId: string;
    paymentDate: string;
    paymentAmount: number;
    currency: string;
    principalAmount?: number;
    interestAmount?: number;
    paymentMethod: string;
    status: string;
    referenceNumber?: string;
    paymentLocation?: string;
}