import {useUser} from '@/contexts/user-provider';
import {Navigate} from 'react-router';
import {Loader2} from 'lucide-react';
import type {ReactNode} from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

export const ProtectedRoute = ({children}: ProtectedRouteProps) => {
    const {user, loading} = useUser();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600"/>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" replace/>;
    }

    return <>{children}</>;
};

