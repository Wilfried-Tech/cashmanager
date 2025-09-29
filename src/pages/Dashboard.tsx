import {useState} from 'react';
import {signOut} from 'firebase/auth';
import {auth} from '../firebase';
import {OperationDialog} from '../components/OperationDialog';
import {Button} from '@/components/ui/button';
import {BarChart3, History as HistoryIcon, LogOut, Menu, Plus, User, Wallet, X} from 'lucide-react';
import {useUser} from "@/contexts/user-provider.tsx";
import {Outlet, useLocation, useNavigate} from "react-router";

export const Dashboard = () => {
    const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
    const [operationType, setOperationType] = useState<'income' | 'expense'>('expense');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate()
    const location = useLocation();
    const {user} = useUser();
    const userId = user!.uid;

    const isActive = (path: string) => {
        if (path === '' && location.pathname === '/dashboard') return true;
        return location.pathname.endsWith(path);
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    const handleAddOperation = (type: 'income' | 'expense') => {
        setOperationType(type);
        setIsOperationDialogOpen(true);
    };

    return (
        <div className="min-h-screen bg-background">
            <header
                className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div
                                className="p-2 bg-primary rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-110">
                                <Wallet className="w-6 h-6 text-primary-foreground"/>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Cash Manager</h1>
                                <p className="text-xs text-muted-foreground">Tableau de bord</p>
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center gap-1">
                            <Button
                                variant={isActive('') ? "default" : "ghost"}
                                onClick={() => navigate('/dashboard')}
                                className={`relative overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                                    isActive('')
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent/70 hover:shadow-md'
                                }`}
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 opacity-0 transition-opacity duration-300 ${
                                        isActive('') ? 'opacity-100' : 'group-hover:opacity-100'
                                    }`}></div>
                                <BarChart3 className="w-4 h-4 mr-2 relative z-10"/>
                                <span className="relative z-10">Dashboard</span>
                                {isActive('') && (
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground/30"></div>
                                )}
                            </Button>
                            <Button
                                variant={isActive('history') ? "default" : "ghost"}
                                onClick={() => navigate('history')}
                                className={`relative overflow-hidden transition-all duration-300 transform hover:scale-105 ${
                                    isActive('history')
                                        ? 'bg-primary text-primary-foreground'
                                        : 'hover:bg-accent/70 hover:shadow-md'
                                }`}
                            >
                                <div
                                    className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 opacity-0 transition-opacity duration-300 ${
                                        isActive('history') ? 'opacity-100' : 'group-hover:opacity-100'
                                    }`}></div>
                                <HistoryIcon className="w-4 h-4 mr-2 relative z-10"/>
                                <span className="relative z-10">Historique</span>
                                {isActive('history') && (
                                    <div
                                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-foreground/30"></div>
                                )}
                            </Button>
                        </nav>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="transition-all duration-200 hover:bg-accent/70 hover:shadow-md transform hover:scale-105"
                            >
                                <User className="w-4 h-4 mr-2"/>
                                <span className="hidden sm:inline">Profil</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSignOut}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:shadow-md transform hover:scale-105"
                            >
                                <LogOut className="w-4 h-4 mr-2"/>
                                <span className="hidden sm:inline">Déconnexion</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden transition-all duration-200 hover:bg-accent/70 transform hover:scale-105"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                <div className="relative w-5 h-5">
                                    <X className={`w-5 h-5 absolute transition-all duration-300 ${
                                        isMobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'
                                    }`}/>
                                    <Menu className={`w-5 h-5 absolute transition-all duration-300 ${
                                        !isMobileMenuOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'
                                    }`}/>
                                </div>
                            </Button>
                        </div>
                    </div>
                </div>

                <div
                    className={`md:hidden bg-card border-t border-border px-4 transition-all duration-300 ease-in-out ${
                        isMobileMenuOpen
                            ? 'py-3 max-h-40 opacity-100'
                            : 'py-0 max-h-0 opacity-0 overflow-hidden'
                    }`}>
                    <div className="space-y-2">
                        <Button
                            variant={isActive('') ? "default" : "ghost"}
                            className={`w-full justify-start transition-all duration-200 transform hover:scale-[1.02] ${
                                isActive('')
                                    ? 'bg-primary shadow-md'
                                    : 'hover:bg-accent/70'
                            }`}
                            onClick={() => {
                                navigate('/dashboard');
                                setIsMobileMenuOpen(false);
                            }}
                        >
                            <BarChart3 className="w-4 h-4 mr-2"/>
                            Dashboard
                        </Button>
                        <Button
                            variant={isActive('history') ? "default" : "ghost"}
                            className={`w-full justify-start transition-all duration-200 transform hover:scale-[1.02] ${
                                isActive('history')
                                    ? 'bg-primary shadow-md'
                                    : 'hover:bg-accent/70'
                            }`}
                            onClick={() => {
                                navigate('history');
                                setIsMobileMenuOpen(false);
                            }}
                        >
                            <HistoryIcon className="w-4 h-4 mr-2"/>
                            Historique
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
                <Outlet/>
                <div className="fixed bottom-6 right-6 z-50">
                    <Button
                        onClick={() => handleAddOperation('expense')}
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary ring-2 ring-primary/20 hover:ring-primary/40 active:scale-95"
                    >
                        <Plus className="w-6 h-6 transition-transform duration-200 group-hover:rotate-90"/>
                    </Button>
                </div>
            </main>

            <OperationDialog
                isOpen={isOperationDialogOpen}
                onClose={() => setIsOperationDialogOpen(false)}
                userId={userId}
                defaultType={operationType}
            />
        </div>
    );
};
