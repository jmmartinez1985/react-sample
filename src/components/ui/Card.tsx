import React from 'react';
import { CardProps } from '@/types';

const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`bg-white shadow-md rounded-lg overflow-hidden border border-gray-100 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;