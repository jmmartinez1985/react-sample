import React from 'react';
import { AuthLayoutProps } from '@/types';
import Card from '@components/ui/Card';
import Header from '@components/layout/Header';
import Footer from '@components/layout/Footer';

const AuthLayout: React.FC<AuthLayoutProps> = ({
                                                   children,
                                                   title = 'Bienvenido',
                                                   subtitle = ''
                                               }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header />

            <main className="flex-grow flex items-center justify-center p-4 py-12">
                <div className="w-full max-w-md">
                    <div className="flex justify-center mb-6">
                        <div className="w-12 h-12 bg-primary-700 rounded-full flex items-center justify-center">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6 text-white"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                                />
                            </svg>
                        </div>
                    </div>

                    <Card className="w-full p-6 shadow-lg">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                            {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
                        </div>

                        <div className="mt-6">
                            {children}
                        </div>
                    </Card>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Acceso seguro con La Hipotecaria</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default AuthLayout;