import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product, ProductType, ProductStatus } from '@/types/products';
import Button from '@components/ui/Button';

interface ProductCardProps {
    product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const navigate = useNavigate();

    const getCardColorClass = (type: ProductType): string => {
        switch (type) {
            case ProductType.SAVINGS:
                return 'border-green-500 bg-green-50';
            case ProductType.DEPOSIT:
                return 'border-blue-500 bg-blue-50';
            case ProductType.FIXED_TERM:
                return 'border-purple-500 bg-purple-50';
            case ProductType.CREDIT:
                return 'border-red-500 bg-red-50';
            default:
                return 'border-gray-500 bg-gray-50';
        }
    };

    const getProductTypeIcon = (type: ProductType): React.ReactNode => {
        switch (type) {
            case ProductType.SAVINGS:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case ProductType.DEPOSIT:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                );
            case ProductType.FIXED_TERM:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            case ProductType.CREDIT:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                );
            default:
                return (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                );
        }
    };

    const getStatusBadge = (status?: ProductStatus): React.ReactNode => {
        if (!status) return null;

        const statusConfig = {
            [ProductStatus.ACTIVE]: {
                color: 'bg-green-100 text-green-800',
                text: 'Activo'
            },
            [ProductStatus.INACTIVE]: {
                color: 'bg-gray-100 text-gray-800',
                text: 'Inactivo'
            },
            [ProductStatus.BLOCKED]: {
                color: 'bg-yellow-100 text-yellow-800',
                text: 'Bloqueado'
            },
            [ProductStatus.CLOSED]: {
                color: 'bg-red-100 text-red-800',
                text: 'Cerrado'
            }
        };

        const config = statusConfig[status];
        return (
            <span className={`px-2 py-1 text-xs rounded-full ${config.color}`}>
                {config.text}
            </span>
        );
    };

    const formatCurrency = (amount?: number, currency?: string): string => {
        if (amount === undefined) return 'No disponible';
        return new Intl.NumberFormat('es-PA', {
            style: 'currency',
            currency: currency || 'USD'
        }).format(amount);
    };

    const handleViewDetail = () => {
        navigate(`/products/${product.productId}/detail`);
    };

    const handleViewMovements = () => {
        navigate(`/products/${product.productId}/movements`);
    };

    return (
        <div className={`border-l-4 shadow-md rounded-lg overflow-hidden ${getCardColorClass(product.productType)}`}>
            <div className="p-5">
                <div className="flex justify-between items-start">
                    <div className="flex items-center">
                        {getProductTypeIcon(product.productType)}
                        <div className="ml-4">
                            <h3 className="text-lg font-semibold text-gray-800">{product.productName}</h3>
                            {product.accountNumber && (
                                <p className="text-sm text-gray-600">
                                    N° {product.accountNumber}
                                </p>
                            )}
                        </div>
                    </div>
                    <div>
                        {getStatusBadge(product.status)}
                    </div>
                </div>

                <div className="mt-4">
                    {product.balance !== undefined && (
                        <div className="mb-2">
                            <p className="text-sm text-gray-600">Saldo disponible</p>
                            <p className="text-xl font-bold text-gray-800">
                                {formatCurrency(product.balance, product.currency)}
                            </p>
                        </div>
                    )}

                    {product.openDate && (
                        <div className="mb-2 text-sm">
                            <span className="text-gray-500">Fecha de apertura:</span>{' '}
                            <span className="text-gray-700">{new Date(product.openDate).toLocaleDateString('es-PA')}</span>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleViewDetail}
                    >
                        Ver detalle
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewMovements}
                    >
                        Ver movimientos
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;