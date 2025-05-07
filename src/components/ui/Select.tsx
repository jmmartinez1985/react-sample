// src/components/ui/Select.tsx

import React, { forwardRef } from 'react';
import classNames from 'classnames';

type SelectSize = 'sm' | 'md' | 'lg';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    error?: string;
    fullWidth?: boolean;
    size?: SelectSize;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ children, className, error, fullWidth = false, size = 'md', ...props }, ref) => {
        // Determinar clases basadas en tamaño
        const sizeClasses: Record<SelectSize, string> = {
            sm: 'py-1 px-2 text-sm',
            md: 'py-2 px-3 text-base',
            lg: 'py-3 px-4 text-lg',
        };

        // Asegurar que size es una clave válida
        const validSize: SelectSize = (size in sizeClasses) ? size as SelectSize : 'md';

        // Obtener la clase CSS correspondiente al tamaño
        const sizeClass = sizeClasses[validSize];

        return (
            <div className={fullWidth ? 'w-full' : ''}>
                <select
                    ref={ref}
                    className={classNames(
                        'block border rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500',
                        sizeClass,
                        {
                            'w-full': fullWidth,
                            'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500': !!error,
                            'border-gray-300': !error,
                        },
                        className
                    )}
                    {...props}
                >
                    {children}
                </select>
                {error && (
                    <p className="mt-1 text-sm text-red-600" id={`${props.name}-error`}>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

export default Select;