import {createContext, type ReactNode, useContext} from 'react';
import {useAuthState} from 'react-firebase-hooks/auth';
import {auth} from '@/firebase';
import type {User} from 'firebase/auth';

interface UserContextType {
    user: User | null | undefined;
    loading: boolean;
    error?: Error;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

interface UserProviderProps {
    children: ReactNode;
}

export const UserProvider = ({children}: UserProviderProps) => {
    const [user, loading, error] = useAuthState(auth);

    return (
        <UserContext.Provider value={{user, loading, error}}>
            {children}
        </UserContext.Provider>
    );
};

