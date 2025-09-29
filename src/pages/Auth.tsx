import {useState} from 'react';
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup
} from 'firebase/auth';
import {auth, googleAuthProvider} from '@/firebase';
import {Button} from "@/components/ui/button.tsx";
import {Input} from "@/components/ui/input.tsx";
import {Loader2} from "lucide-react";
import {useUser} from '@/contexts/user-provider';
import {Navigate} from 'react-router';

export const Auth = () => {
    const {user} = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [isSignup, setIsSignup] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleAuth = async () => {
        try {
            setLoading(true);
            setError('');
            setMessage('');

            if (isSignup) {
                await createUserWithEmailAndPassword(auth, email, password);
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error: any) {
            setError(getErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleAuthProvider);
        } catch (error) {
            console.error(error);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            setError('Veuillez entrer votre adresse email');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setMessage('');

            await sendPasswordResetEmail(auth, email);
            setMessage('Un email de réinitialisation a été envoyé à votre adresse email');
        } catch (error: any) {
            console.error(error);
            setError(getErrorMessage(error.code));
        } finally {
            setLoading(false);
        }
    };

    const getErrorMessage = (errorCode: string) => {
        switch (errorCode) {
            case 'auth/invalid-credential':
                return 'Identifiants invalides';
            case 'auth/user-not-found':
                return 'Aucun compte trouvé avec cette adresse email';
            case 'auth/wrong-password':
                return 'Mot de passe incorrect';
            case 'auth/email-already-in-use':
                return 'Cette adresse email est déjà utilisée';
            case 'auth/weak-password':
                return 'Le mot de passe doit contenir au moins 6 caractères';
            case 'auth/invalid-email':
                return 'Adresse email invalide';
            case 'auth/too-many-requests':
                return 'Trop de tentatives. Veuillez réessayer plus tard';
            default:
                return 'Une erreur est survenue. Veuillez réessayer';
        }
    };

    const resetForm = () => {
        setShowForgotPassword(false);
        setError('');
        setMessage('');
        setEmail('');
        setPassword('');
    };

    if (user) {
        return <Navigate to="/dashboard" replace/>;
    }

    if (showForgotPassword) {
        return (
            <div className="container flex items-center justify-center p-4 min-h-screen mx-auto">
                <div className="w-full max-w-md bg-card rounded-xl shadow-2xl p-8 space-y-6 border">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-foreground mb-2">
                            Mot de passe oublié
                        </h1>
                        <p className="text-muted-foreground">
                            Entrez votre email pour recevoir un lien de réinitialisation
                        </p>
                    </div>

                    <div className="space-y-4">
                        {error && (
                            <div
                                className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div
                                className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                {message}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre@email.com"
                                className="w-full"
                                disabled={loading}
                            />
                        </div>

                        <Button
                            onClick={handleForgotPassword}
                            disabled={loading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
                        >
                            {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin'/>}
                            Envoyer le lien de réinitialisation
                        </Button>

                        <div className="text-center">
                            <Button
                                variant="link"
                                disabled={loading}
                                onClick={resetForm}
                                className="text-primary hover:text-primary/80 font-medium disabled:opacity-70"
                            >
                                Retour à la connexion
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container flex items-center justify-center p-4 min-h-screen mx-auto">
            <div className="w-full max-w-md bg-card rounded-xl shadow-2xl p-8 space-y-6 border">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {isSignup ? 'Créer un compte' : 'Connexion'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isSignup ? 'Rejoignez-nous aujourd\'hui' : 'Bon retour parmi nous'}
                    </p>
                </div>

                <div className="space-y-4">
                    {error && (
                        <div
                            className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="votre@email.com"
                            className="w-full"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Mot de passe</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full"
                            disabled={loading}
                        />
                    </div>

                    <Button
                        onClick={handleAuth}
                        disabled={loading}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
                    >
                        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin'/>}
                        {isSignup ? 'S\'inscrire' : 'Se connecter'}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t"/>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">ou</span>
                        </div>
                    </div>

                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        variant="outline"
                        className="w-full border-2 hover:bg-accent font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none disabled:opacity-70"
                    >
                        {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin'/>}
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path fill="#4285F4"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continuer avec Google
                    </Button>

                    {!isSignup && (
                        <div className="text-center">
                            <Button
                                variant="link"
                                disabled={loading}
                                onClick={() => setShowForgotPassword(true)}
                                className="text-sm text-muted-foreground hover:text-primary disabled:opacity-70"
                            >
                                Mot de passe oublié ?
                            </Button>
                        </div>
                    )}

                    <div className="text-center">
                        <Button
                            variant="link"
                            disabled={loading}
                            onClick={() => {
                                setIsSignup(!isSignup);
                                setError('');
                                setMessage('');
                            }}
                            className="text-primary hover:text-primary/80 font-medium disabled:opacity-70"
                        >
                            {isSignup ? 'Déjà un compte ? Se connecter' : 'Créer un compte'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};