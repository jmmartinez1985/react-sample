// src/components/auth/RegisterForm.tsx con los cambios necesarios

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import customerService from '@services/customerService';
import Input from '@components/ui/Input';
import Button from '@components/ui/Button';
import Alert from '@components/ui/Alert';

// Esquema de validación actualizado
const registerSchema = z.object({
    // Username y contraseña
    username: z.string()
        .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
        .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
        .regex(/^[a-zA-Z0-9_.-]+$/, 'El nombre de usuario solo puede contener letras, números, puntos, guiones y guiones bajos'),

    // Email
    email: z.string()
        .email('Debe ser un email válido')
        .min(1, 'El email es requerido'),

    // Contraseña
    password: z.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .regex(/[A-Z]/, 'La contraseña debe contener al menos una letra mayúscula')
        .regex(/[a-z]/, 'La contraseña debe contener al menos una letra minúscula')
        .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
        .regex(/[^A-Za-z0-9]/, 'La contraseña debe contener al menos un carácter especial'),

    confirmPassword: z.string().min(1, 'Confirma tu contraseña'),

    // Nombre completo (opcional)
    name: z.string().optional(),

    // Nuevos campos para la identificación
    identificationType: z.enum(['CEDULA', 'PASAPORTE', 'RUC'], {
        errorMap: () => ({ message: 'Seleccione un tipo de identificación válido' }),
    }),
    identificationNumber: z.string().min(1, 'El número de identificación es requerido')
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
    const [customerId, setCustomerId] = useState<string | null>(null);

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

            // Validar la identificación del cliente antes de registrarlo
            try {
                const customerResponse = await customerService.validateCustomerIdentification(
                    data.identificationType,
                    data.identificationNumber
                );

                // Si la respuesta es exitosa, obtenemos el ID del cliente
                if (customerResponse.data && customerResponse.data.customerId) {
                    setCustomerId(customerResponse.data.customerId);
                } else {
                    throw { error: 'No se pudo verificar la identificación del cliente' };
                }
            } catch (customerError: any) {
                setError(customerError.error || 'Error al validar la identificación. Verifique sus datos.');
                setIsSubmitting(false);
                return;
            }

            // Preparar los datos para el registro incluyendo los nuevos campos
            const userData = {
                username: data.username,
                password: data.password,
                email: data.email,
                name: data.name,
                // Incluir los campos adicionales como atributos personalizados
                idtype: data.identificationType,
                idnumber: data.identificationNumber,
                customerid: customerId
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

            {/* Nuevos campos para tipo y número de identificación */}
            <div className="w-full mb-4">
                <label htmlFor="identificationType" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Identificación <span className="text-red-500">*</span>
                </label>
                <select
                    id="identificationType"
                    className={`
                        form-select
                        w-full px-3 py-2 
                        border rounded-md shadow-sm 
                        bg-white
                        placeholder-gray-400 
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        disabled:bg-gray-100 disabled:text-gray-500
                        ${errors.identificationType ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'} 
                    `}
                    {...register('identificationType')}
                >
                    <option value="">Seleccionar...</option>
                    <option value="CEDULA">Cédula</option>
                    <option value="PASAPORTE">Pasaporte</option>
                    <option value="RUC">RUC</option>
                </select>
                {errors.identificationType && (
                    <p className="mt-1 text-sm text-red-600">{errors.identificationType.message}</p>
                )}
            </div>

            <Input
                label="Número de Identificación"
                id="identificationNumber"
                type="text"
                placeholder="Ingrese su número de identificación"
                error={errors.identificationNumber?.message}
                register={register('identificationNumber')}
                required
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