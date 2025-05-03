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
    AND = 'AND',
    OR = 'OR'
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
export interface Product {
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
}

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

// Interfaz para los movimientos de un producto
export interface ProductMovement {
    movementId: string;
    productId: string;
    transactionDate: string;
    description: string;
    amount: number;
    balance: number;
    type: 'CREDIT' | 'DEBIT';
    category?: string;
    reference?: string;
}