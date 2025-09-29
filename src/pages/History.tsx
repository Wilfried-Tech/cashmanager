import {useEffect, useState} from 'react';
import {collection, onSnapshot, orderBy, query} from 'firebase/firestore';
import {db} from '../firebase';
import {OperationsList} from '../components/OperationsList';
import {Button} from '@/components/ui/button';
import {Plus} from 'lucide-react';
import type {Category, Operation} from '../types';
import {OperationDialog} from '../components/OperationDialog';
import {useUser} from '@/contexts/user-provider';

export const History = () => {
    const {user} = useUser();
    const userId = user!.uid;
    const [categories, setCategories] = useState<Category[]>([]);
    const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
    const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
    const [operationType, setOperationType] = useState<'income' | 'expense'>('expense');

    useEffect(() => {
        const categoriesQuery = query(
            collection(db, 'users', userId, 'categories'),
            orderBy('name')
        );

        const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Category));
            setCategories(cats);
        });

        return () => unsubscribe();
    }, [userId]);


    const handleAddOperation = (type: 'income' | 'expense') => {
        setEditingOperation(null);
        setOperationType(type);
        setIsOperationDialogOpen(true);
    };

    const handleEditOperation = (operation: Operation) => {
        setEditingOperation(operation);
        setIsOperationDialogOpen(true);
    };

    const handleDialogClose = () => {
        setIsOperationDialogOpen(false);
        setEditingOperation(null);
    };

    const categoriesMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
    }, {} as { [id: string]: string });


    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Historique des opérations</h2>
                    <p className="text-muted-foreground">Gérez toutes vos transactions financières</p>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={() => handleAddOperation('income')}
                        variant="outline"
                        className="hidden sm:flex"
                    >
                        <Plus className="w-4 h-4 mr-2"/>
                        Revenu
                    </Button>
                    <Button
                        onClick={() => handleAddOperation('expense')}
                        variant="outline"
                        className="hidden sm:flex"
                    >
                        <Plus className="w-4 h-4 mr-2"/>
                        Dépense
                    </Button>
                </div>
            </div>

            <OperationsList
                categories={categoriesMap}
                onEdit={handleEditOperation}
            />

            <OperationDialog
                isOpen={isOperationDialogOpen}
                onClose={handleDialogClose}
                userId={userId}
                defaultType={operationType}
                editingOperation={editingOperation}
            />
        </>
    );
};
