import {z} from 'zod';

// Schémas de validation pour l'authentification
export const loginSchema = z.object({
    email: z
        .email('Format d\'email invalide')
        .min(1, 'L\'email est requis'), password: z
        .string()
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
});

export const signupSchema = z.object({
    email: z.email('Format d\'email invalide').min(1, 'L\'email est requis'),
    password: z
        .string()
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas', path: ['confirmPassword']
});

export const forgotPasswordSchema = z.object({
    email: z.email('Format d\'email invalide').min(1, 'L\'email est requis')

});

export type LoginForm = z.infer<typeof loginSchema>;
export type SignupForm = z.infer<typeof signupSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
