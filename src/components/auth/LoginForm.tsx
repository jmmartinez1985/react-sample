import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import Alert from '@components/ui/Alert';

// Esquema de validación
const loginSchema = z.object({
    username: z.string().min(1, 'El nombre de usuario es requerido'),
    password: z.string().min(1, 'La contraseña es requerida')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
    const { login } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema)
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            setIsSubmitting(true);
            setError(null);

            const success = await login(data.username, data.password);

            if (!success) {
                setError('Credenciales incorrectas. Por favor intenta nuevamente.');
            }
        } catch (err: any) {
            setError(err?.error || 'Error al iniciar sesión');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert
                    variant="error"
                    title="Error de inicio de sesión"
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            <div className="form-control">
                <Input
                    label="Nombre de Usuario"
                    id="username"
                    type="text"
                    placeholder="Ingresa tu nombre de usuario"
                    error={errors.username?.message}
                    register={register('username')}
                    required
                />
                <p className="text-xs text-gray-500 mt-1">
                    Ingresa el nombre de usuario con el que te registraste (no tu correo electrónico).
                </p>
            </div>

            <div className="form-control">
                <Input
                    label="Contraseña"
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    register={register('password')}
                    required
                />
            </div>

            <div className="flex items-center justify-between">
                <div className="text-sm">
                    <Link to="/forgot-password" className="text-primary-700 hover:text-primary-800">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>

            <div className="mt-6">
                <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                >
                    Iniciar Sesión
                </Button>
            </div>

            <div className="text-center text-sm text-gray-500 mt-4">
                ¿No tienes una cuenta?{' '}
                <Link to="/register" className="text-primary-700 hover:text-primary-800 font-medium">
                    Regístrate
                </Link>
            </div>
        </form>
    );
};

export default LoginForm;