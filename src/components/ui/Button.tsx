import React from 'react';
import { ButtonProps } from '@/types';

const variants = {
    primary: 'bg-primary-700 hover:bg-primary-800 active:bg-primary-900 text-white shadow-sm',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 active:bg-secondary-800 text-white shadow-sm',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
    outline: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
    ghost: 'bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100',
};

const sizes = {
    sm: 'py-1.5 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
};

const Button: React.FC<ButtonProps> = ({
                                           children,
                                           variant = 'primary',
                                           size = 'md',
                                           className = '',
                                           isLoading = false,
                                           disabled = false,
                                           type = 'button',
                                           ...props
                                       }) => {
    return (
        <button
            type={type}
            className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-md font-medium 
        focus:outline-none focus:ring-2 focus:ring-primary-700 focus:ring-offset-2
        transition-all duration-200 ease-in-out
        flex items-center justify-center
        ${isLoading || disabled ? 'opacity-70 cursor-not-allowed' : ''}
        ${className}
      `}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {children}
                </>
            ) : (
                children
            )}
        </button>
    );
};

export default Button;