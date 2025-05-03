import { Product, ProductType, ProductStatus, OwnershipType, ProductMovement } from '@/types/products';

// Productos de ejemplo
export const mockProducts: Product[] = [
    {
        productId: 'PRD123456',
        productType: ProductType.SAVINGS,
        productName: 'Cuenta de Ahorro Plus',
        accountNumber: '1234567890',
        balance: 5236.75,
        currency: 'USD',
        status: ProductStatus.ACTIVE,
        ownershipType: OwnershipType.PRIMARY,
        openDate: '2023-05-15',
        additionalData: { interestRate: 2.5, lastInterestDate: '2025-03-15' }
    },
    {
        productId: 'PRD234567',
        productType: ProductType.CREDIT,
        productName: 'Préstamo Hipotecario',
        accountNumber: '9876543210',
        balance: 120000.00,
        currency: 'USD',
        status: ProductStatus.ACTIVE,
        ownershipType: OwnershipType.PRIMARY,
        openDate: '2022-01-10',
        additionalData: {
            interestRate: 6.5,
            nextPaymentDate: '2025-05-15',
            monthlyPayment: 950.25,
            term: '25 años',
            originalAmount: 145000.00,
            guaranteeType: 'Hipotecaria',
            propertyAddress: 'Calle 50, Torre Global, Panamá'
        }
    },
    {
        productId: 'PRD345678',
        productType: ProductType.DEPOSIT,
        productName: 'Cuenta Corriente',
        accountNumber: '5555666677',
        balance: 2500.50,
        currency: 'USD',
        status: ProductStatus.ACTIVE,
        ownershipType: OwnershipType.PRIMARY,
        openDate: '2023-11-20'
    },
    {
        productId: 'PRD456789',
        productType: ProductType.FIXED_TERM,
        productName: 'Depósito a Plazo Fijo',
        accountNumber: '8888999900',
        balance: 10000.00,
        currency: 'USD',
        status: ProductStatus.ACTIVE,
        ownershipType: OwnershipType.PRIMARY,
        openDate: '2024-02-05',
        additionalData: {
            interestRate: 3.8,
            maturityDate: '2025-02-05',
            term: '12 meses',
            renewalType: 'Automática',
            paymentFrequency: 'Al vencimiento'
        }
    },
    {
        productId: 'PRD567890',
        productType: ProductType.CREDIT,
        productName: 'Préstamo Personal',
        accountNumber: '7777666655',
        balance: 8500.00,
        currency: 'USD',
        status: ProductStatus.ACTIVE,
        ownershipType: OwnershipType.PRIMARY,
        openDate: '2023-08-15',
        additionalData: {
            interestRate: 9.5,
            nextPaymentDate: '2025-05-01',
            monthlyPayment: 325.75,
            term: '5 años',
            originalAmount: 15000.00
        }
    },
    {
        productId: 'PRD678901',
        productType: ProductType.SAVINGS,
        productName: 'Cuenta de Ahorro Navideño',
        accountNumber: '1212343456',
        balance: 1200.00,
        currency: 'USD',
        status: ProductStatus.ACTIVE,
        ownershipType: OwnershipType.PRIMARY,
        openDate: '2025-01-10',
        additionalData: {
            interestRate: 3.0,
            maturityDate: '2025-12-01',
            automaticDebit: true,
            monthlyContribution: 100.00
        }
    }
];

// Función para generar movimientos de ejemplo para un producto
export const generateMockMovements = (productId: string, count: number = 15): ProductMovement[] => {
    const product = mockProducts.find(p => p.productId === productId);
    if (!product) return [];

    const movements: ProductMovement[] = [];
    let currentBalance = product.balance || 0;
    const today = new Date();
    //const currency = product.currency || 'USD';

    // Nombres para las transacciones
    const creditDescriptions = [
        'Depósito en efectivo',
        'Transferencia recibida',
        'Pago de nómina',
        'Abono de intereses',
        'Reembolso',
        'Depósito de cheque',
        'Transferencia ACH recibida'
    ];

    const debitDescriptions = [
        'Retiro en cajero',
        'Transferencia enviada',
        'Pago de servicio',
        'Compra con tarjeta',
        'Pago domiciliado',
        'Cargo por comisión',
        'Pago de préstamo'
    ];

    const categories = [
        'Transacción bancaria',
        'Salario',
        'Ahorro',
        'Gastos diarios',
        'Servicios',
        'Entretenimiento',
        'Alimentación',
        'Transporte'
    ];

    // Generar movimientos aleatorios
    for (let i = 0; i < count; i++) {
        const isCredit = Math.random() > 0.5;
        const date = new Date(today);
        date.setDate(today.getDate() - i * 2 - Math.floor(Math.random() * 5)); // Distribución en los últimos días

        const amount = parseFloat((Math.random() * 500 + 50).toFixed(2));

        if (isCredit) {
            currentBalance -= amount; // Restamos para ir hacia atrás en el tiempo
        } else {
            currentBalance += amount;
        }

        // Para que no quede negativo
        if (currentBalance < 0 && product.productType !== ProductType.CREDIT) {
            currentBalance = 100; // Balance mínimo
        }

        const descriptions = isCredit ? creditDescriptions : debitDescriptions;
        const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];

        // Generar referencia aleatoria
        const generateReference = () => {
            const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            let reference = '';
            for (let i = 0; i < 8; i++) {
                reference += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            return reference;
        };

        movements.push({
            movementId: `MOV${Date.now().toString().substring(7)}${i}`,
            productId,
            transactionDate: date.toISOString(),
            description: randomDescription,
            amount,
            balance: parseFloat(currentBalance.toFixed(2)),
            type: isCredit ? 'CREDIT' : 'DEBIT',
            category: randomCategory,
            reference: generateReference()
        });
    }

    // Ordenar por fecha, del más reciente al más antiguo
    return movements.sort((a, b) =>
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    );
};

// Función para simular la obtención de datos de productos
export const getMockCustomerProducts = (customerId: string) => {
    return {
        customerId,
        customerName: 'Juan Pérez Rodríguez',
        products: mockProducts,
        lastUpdateDate: new Date().toISOString()
    };
};

// Función para modificar el servicio de productos para usar datos de ejemplo
export const setupMockProductService = (productService: any) => {
    // Sobreescribir los métodos del servicio para usar datos de ejemplo
    productService.getCustomerProducts = async (customerId: string) => {
        return getMockCustomerProducts(customerId);
    };

    productService.getProductDetail = async (productId: string) => {
        const product = mockProducts.find(p => p.productId === productId);
        if (!product) {
            throw { error: 'Producto no encontrado' };
        }
        return product;
    };

    productService.getProductMovements = async (productId: string) => {
        return generateMockMovements(productId);
    };

    return productService;
};