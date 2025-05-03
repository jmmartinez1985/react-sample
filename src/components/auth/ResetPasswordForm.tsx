import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import Alert from '@components/ui/Alert';

// Esquema de validación
const resetPasswordSchema = z.object({
    username: z.string().min(1, 'El email es requerido'),
    confirmationCode: z.string().min(1, 'El código de recuperación es requerido'),
    newPassword: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
        .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
        .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
        .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

interface LocationState {
    username?: string;
}

const ResetPasswordForm: React.FC = () => {
    const { resetPassword } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const locationState = location.state as LocationState;

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors }
    } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            username: locationState?.username || ''
        }
    });

    // Establecer el username si viene en el estado de la navegación
    useEffect(() => {
        if (locationState?.username) {
            setValue('username', locationState.username);
        }
    }, [locationState?.username, setValue]);

    const onSubmit = async (data: ResetPasswordFormValues) => {
        try {
            setIsSubmitting(true);
            setError(null);

            await resetPassword(data.username, data.confirmationCode, data.newPassword);

            setSuccess('Contraseña restablecida exitosamente.');

            // Redirigir al login después de restablecer la contraseña
            setTimeout(() => {
                navigate('/login', {
                    state: { message: 'Contraseña restablecida exitosamente. Ya puedes iniciar sesión.' }
                });
            }, 2000);
        } catch (err: any) {
            setError(err?.error || 'Error al restablecer la contraseña. Intenta nuevamente.');
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
                    title="Contraseña restablecida"
                >
                    {success}
                </Alert>
            )}

            <Input
                label="Email"
                id="username"
                type="email"
                placeholder="ejemplo@correo.com"
                error={errors.username?.message}
                register={register('username')}
                disabled={!!locationState?.username}
                required
            />

            <Input
                label="Código de recuperación"
                id="confirmationCode"
                type="text"
                placeholder="123456"
                error={errors.confirmationCode?.message}
                register={register('confirmationCode')}
                required
            />

            <Input
                label="Nueva contraseña"
                id="newPassword"
                type="password"
                placeholder="••••••••"
                error={errors.newPassword?.message}
                register={register('newPassword')}
                required
            />

            <Input
                label="Confirmar nueva contraseña"
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                register={register('confirmPassword')}
                required
            />

            <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full"
            >
                Restablecer contraseña
            </Button>

            <div className="flex items-center justify-between text-sm">
                <Link to="/login" className="text-primary-600 hover:text-primary-500">
                    Volver a inicio de sesión
                </Link>
            </div>
        </form>
    );
};

export default ResetPasswordForm;