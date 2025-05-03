import React from 'react';
import { FooterProps } from '@/types';

const Footer: React.FC<FooterProps> = ({ className = '' }) => {
    const year = new Date().getFullYear();

    return (
        <footer className={`py-4 bg-white border-t border-gray-200 ${className}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center text-sm text-gray-500">
                    <p>© {year} La Hipotecaria. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;