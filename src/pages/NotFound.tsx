import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@components/ui/Button';

const NotFound: React.FC = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="text-center">
                <h1 className="text-9xl font-bold text-primary-600">404</h1>
                <h2 className="text-3xl font-semibold text-gray-900 mt-4">Página no encontrada</h2>
                <p className="text-gray-600 mt-2 mb-6">
                    La página que estás buscando no existe o ha sido movida.
                </p>
                <Link to="/">
                    <Button variant="primary">
                        Volver al inicio
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default NotFound;