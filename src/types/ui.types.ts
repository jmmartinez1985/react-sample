import { ReactNode } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

// Tipos para componentes UI
export interface ButtonProps {
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    isLoading?: boolean;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
    [key: string]: any;
}

export interface InputProps {
    label?: string;
    id: string;
    name?: string;
    type?: string;
    placeholder?: string;
    error?: string;
    register?: UseFormRegisterReturn;
    className?: string;
    required?: boolean;
    [key: string]: any;
}

export interface CardProps {
    children: ReactNode;
    className?: string;
    [key: string]: any;
}

export interface AlertProps {
    children: ReactNode;
    variant?: 'success' | 'error' | 'warning' | 'info';
    title?: string;
    className?: string;
    onClose?: (() => void) | null;
    [key: string]: any;
}

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    className?: string;
}

// Tipos para componentes de layout
export interface AuthLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

export interface HeaderProps {
    logoUrl?: string;
    isAuthenticated?: boolean;
    onLogout?: () => void;
    username?: string;
}

export interface FooterProps {
    className?: string;
}