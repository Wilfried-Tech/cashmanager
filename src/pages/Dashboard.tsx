import {useState} from 'react';
import {signOut} from 'firebase/auth';
import {auth} from '../firebase';
import {OperationDialog} from '../components/OperationDialog';
import {Button} from '@/components/ui/button';
import {BarChart3, History as HistoryIcon, LogOut, Menu, Plus, User, Wallet, X} from 'lucide-react';
import {useUser} from "@/contexts/user-provider.tsx";
import {Outlet, useNavigate} from "react-router";

export const Dashboard = () => {
    const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
    const [operationType, setOperationType] = useState<'income' | 'expense'>('expense');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const navigate = useNavigate()
    const {user} = useUser();
    const userId = user!.uid;


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
            <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary rounded-lg">
                                <Wallet className="w-6 h-6 text-primary-foreground"/>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">Cash Manager</h1>
                                <p className="text-xs text-muted-foreground">Tableau de bord</p>
                            </div>
                        </div>

                        <nav className="hidden md:flex items-center gap-1">
                            <Button variant="default" className="bg-primary text-primary-foreground">
                                <BarChart3 className="w-4 h-4 mr-2"/>
                                Dashboard
                            </Button>
                            <Button variant="ghost" onClick={() => navigate('history')}>
                                <HistoryIcon className="w-4 h-4 mr-2"/>
                                Historique
                            </Button>
                        </nav>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm">
                                <User className="w-4 h-4 mr-2"/>
                                <span className="hidden sm:inline">Profil</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleSignOut}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <LogOut className="w-4 h-4 mr-2"/>
                                <span className="hidden sm:inline">Déconnexion</span>
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
                            </Button>
                        </div>
                    </div>
                </div>

                {isMobileMenuOpen && (
                    <div className="md:hidden bg-card border-t border-border px-4 py-3">
                        <div className="space-y-2">
                            <Button variant="default" className="w-full justify-start bg-primary">
                                <BarChart3 className="w-4 h-4 mr-2"/>
                                Dashboard
                            </Button>
                            <Button variant="ghost" className="w-full justify-start"
                                    onClick={() => navigate('history')}>
                                <HistoryIcon className="w-4 h-4 mr-2"/>
                                Historique
                            </Button>
                        </div>
                    </div>
                )}
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet/>
                <div className="fixed bottom-6 right-6">
                    <Button
                        onClick={() => handleAddOperation('expense')}
                        size="lg"
                        className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-shadow bg-primary hover:bg-primary/90"
                    >
                        <Plus className="w-6 h-6"/>
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
