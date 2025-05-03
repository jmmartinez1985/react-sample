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
const confirmAccountSchema = z.object({
    username: z.string().min(1, 'El email es requerido'),
    confirmationCode: z.string().min(1, 'El código de confirmación es requerido')
});

type ConfirmAccountFormValues = z.infer<typeof confirmAccountSchema>;

interface LocationState {
    username?: string;
}

const ConfirmAccountForm: React.FC = () => {
    const { confirmAccount } = useAuth();
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
    } = useForm<ConfirmAccountFormValues>({
        resolver: zodResolver(confirmAccountSchema),
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

    const onSubmit = async (data: ConfirmAccountFormValues) => {
        try {
            setIsSubmitting(true);
            setError(null);

            await confirmAccount(data.username, data.confirmationCode);

            setSuccess('Cuenta confirmada exitosamente.');

            // Redirigir al login después de confirmar
            setTimeout(() => {
                navigate('/login', {
                    state: { message: 'Cuenta confirmada exitosamente. Ya puedes iniciar sesión.' }
                });
            }, 2000);
        } catch (err: any) {
            setError(err?.error || 'Error al confirmar la cuenta. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert
                    variant="error"
                    title="Error de confirmación"
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert
                    variant="success"
                    title="Confirmación exitosa"
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
                label="Código de confirmación"
                id="confirmationCode"
                type="text"
                placeholder="123456"
                error={errors.confirmationCode?.message}
                register={register('confirmationCode')}
                required
            />

            <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full"
            >
                Confirmar cuenta
            </Button>

            <div className="flex items-center justify-between text-sm">
                <Link to="/login" className="text-primary-600 hover:text-primary-500">
                    Volver a inicio de sesión
                </Link>
            </div>
        </form>
    );
};

export default ConfirmAccountForm;