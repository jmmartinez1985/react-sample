import { useContext } from 'react';
import { AuthContext } from '@context/AuthContext';
import { AuthContextType } from '@/types';

// Hook personalizado para acceder al contexto de autenticación
const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }

    return context;
};

export default useAuth;