import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import Alert from '@components/ui/Alert';

// Esquema de validación
const forgotPasswordSchema = z.object({
    username: z.string().min(1, 'El email es requerido')
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordForm: React.FC = () => {
    const { forgotPassword } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema)
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        try {
            setIsSubmitting(true);
            setError(null);

            const result = await forgotPassword(data.username);

            setSuccess(`Se ha enviado un código de recuperación a ${result.destination}`);

            // Redirigir a la página de restablecimiento de contraseña
            setTimeout(() => {
                navigate('/reset-password', {
                    state: { username: data.username }
                });
            }, 2000);
        } catch (err: any) {
            setError(err?.error || 'Error al solicitar recuperación de contraseña. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert
                    variant="error"
                    title="Error"
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert
                    variant="success"
                    title="Email enviado"
                >
                    {success}
                </Alert>
            )}

            <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                    Ingresa tu email para recibir un código de recuperación de contraseña.
                </p>
            </div>

            <Input
                label="Email"
                id="username"
                type="email"
                placeholder="ejemplo@correo.com"
                error={errors.username?.message}
                register={register('username')}
                required
            />

            <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full"
            >
                Enviar código de recuperación
            </Button>

            <div className="flex items-center justify-between text-sm">
                <Link to="/login" className="text-primary-600 hover:text-primary-500">
                    Volver a inicio de sesión
                </Link>
            </div>
        </form>
    );
};

export default ForgotPasswordForm;