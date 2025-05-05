// src/components/auth/ChangePasswordForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@components/ui/Button';
import Input from '@components/ui/Input';
import Alert from '@components/ui/Alert';
import userService from '@services/userService';

// Esquema de validación
const changePasswordSchema = z.object({
    oldPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string()
        .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
        .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
        .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
        .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña')
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

interface ChangePasswordFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSuccess, onCancel }) => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<ChangePasswordFormValues>({
        resolver: zodResolver(changePasswordSchema)
    });

    const onSubmit = async (data: ChangePasswordFormValues) => {
        try {
            setIsSubmitting(true);
            setError(null);

            // Preparar los datos para la API
            const changePasswordData = {
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            };

            // Llamar al servicio de cambio de contraseña
            await userService.changePassword(changePasswordData);

            // Notificar éxito
            onSuccess();
        } catch (err: any) {
            setError(err?.error?.message || 'Error al cambiar la contraseña');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
                <Alert
                    variant="error"
                    title="Error al cambiar la contraseña"
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            <Input
                label="Contraseña actual"
                id="oldPassword"
                type="password"
                placeholder="••••••••"
                error={errors.oldPassword?.message}
                register={register('oldPassword')}
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

            <div className="pt-2 flex justify-end space-x-3">
                <Button
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    isLoading={isSubmitting}
                >
                    Cambiar contraseña
                </Button>
            </div>
        </form>
    );
};

export default ChangePasswordForm;