import React from 'react';
import { InputProps } from '@/types';

const Input: React.FC<InputProps> = ({
                                         label,
                                         id,
                                         type = 'text',
                                         placeholder = '',
                                         error = '',
                                         register,
                                         className = '',
                                         required = false,
                                         ...props
                                     }) => {
    return (
        <div className="w-full mb-4">
            {label && (
                <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <input
                id={id}
                type={type}
                className={`
          form-input
          w-full px-3 py-2 
          border rounded-md shadow-sm 
          bg-white
          placeholder-gray-400 
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
          disabled:bg-gray-100 disabled:text-gray-500
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'} 
          ${className}
        `}
                placeholder={placeholder}
                {...register}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
};

export default Input;