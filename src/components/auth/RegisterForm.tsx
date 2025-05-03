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
const registerSchema = z.object({
    // Username como campo independiente (puede ser diferente del email)
    username: z.string()
        .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
        .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
        .regex(/^[a-zA-Z0-9_.-]+$/, 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos'),

    // Email como campo independiente
    email: z.string()
        .email('Debe ser un email válido')
        .min(1, 'El email es requerido'),

    // Contraseña con validaciones de seguridad
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
        .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
        .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
        .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),

    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),

    // Nombre completo (opcional)
    name: z.string().optional()
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterForm: React.FC = () => {
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema)
    });

    const onSubmit = async (data: RegisterFormValues) => {
        try {
            setIsSubmitting(true);
            setError(null);

            // Preparar los datos para el registro
            const userData = {
                username: data.username,
                password: data.password,
                email: data.email,
                name: data.name
            };

            // Llamar al servicio de registro
            const result = await registerUser(userData);

            if (result.userConfirmed) {
                // Si el usuario está confirmado automáticamente, redirigir a inicio de sesión
                navigate('/login', {
                    state: { message: 'Registro exitoso. Ya puedes iniciar sesión.' }
                });
            } else {
                // Si requiere confirmación, mostrar mensaje y redirigir
                setSuccess('Registro exitoso. Te hemos enviado un código de verificación.');
                setTimeout(() => {
                    navigate('/confirm-account', {
                        state: { username: data.username }
                    });
                }, 2000);
            }
        } catch (err: any) {
            setError(err?.error || 'Error en el registro. Intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
                <Alert
                    variant="error"
                    title="Error de registro"
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {success && (
                <Alert
                    variant="success"
                    title="Registro exitoso"
                >
                    {success}
                </Alert>
            )}

            <Input
                label="Nombre de Usuario"
                id="username"
                type="text"
                placeholder="usuario123"
                error={errors.username?.message}
                register={register('username')}
                required
            />

            <Input
                label="Email"
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                error={errors.email?.message}
                register={register('email')}
                required
            />

            <Input
                label="Nombre Completo"
                id="name"
                type="text"
                placeholder="Juan Pérez"
                error={errors.name?.message}
                register={register('name')}
            />

            <Input
                label="Contraseña"
                id="password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                register={register('password')}
                required
            />

            <Input
                label="Confirmar Contraseña"
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
                Registrarse
            </Button>

            <div className="text-center text-sm text-gray-500">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-primary-700 hover:text-primary-800">
                    Iniciar Sesión
                </Link>
            </div>
        </form>
    );
};

export default RegisterForm;