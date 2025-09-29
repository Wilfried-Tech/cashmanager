import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {addDoc, collection, doc, Timestamp, updateDoc} from 'firebase/firestore';
import {db} from '../firebase';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {CategorySelector} from './CategorySelector';
import {Calendar, DollarSign, FileText, Loader2, TrendingDown, TrendingUp} from 'lucide-react';
import {useEffect, useState} from 'react';
import {format} from 'date-fns';
import {z} from 'zod';
import type {Operation} from '../types';

const operationSchema = z.object({
    type: z.enum(['income', 'expense']),
    amount: z.number().positive('Le montant doit être positif').min(0.01, 'Le montant minimum est 0.01€'),
    description: z.string().min(1, 'La description est requise').max(100, 'La description ne peut pas dépasser 100 caractères'),
    categoryId: z.string().optional(),
    date: z.date()
});

type OperationFormData = z.infer<typeof operationSchema>;

interface OperationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    editingOperation?: Operation | null;
    defaultType?: 'income' | 'expense';
}

export const OperationDialog = ({
                                    isOpen,
                                    onClose,
                                    userId,
                                    editingOperation,
                                    defaultType = 'expense'
                                }: OperationDialogProps) => {

    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<OperationFormData>({
        resolver: zodResolver(operationSchema),
        defaultValues: {
            type: defaultType,
            amount: 0,
            description: '',
            categoryId: '',
            date: new Date()
        }
    });

    useEffect(() => {
        if (editingOperation && isOpen) {
            form.reset({
                type: editingOperation.type,
                amount: editingOperation.amount,
                description: editingOperation.description,
                categoryId: editingOperation.categoryId || '',
                date: editingOperation.timestamp.toDate()
            });
        } else if (!editingOperation && isOpen) {
            form.reset({
                type: defaultType,
                amount: 0,
                description: '',
                categoryId: '',
                date: new Date()
            });
        }
    }, [editingOperation, isOpen, defaultType, form]);

    const handleSubmit = async (data: OperationFormData) => {
        try {
            setIsSubmitting(true);

            const operationData = {
                amount: data.amount,
                categoryId: data.categoryId || '',
                description: data.description,
                timestamp: Timestamp.fromDate(data.date),
                type: data.type,
                createdAt: Timestamp.now()
            };

            if (editingOperation) {
                await updateDoc(doc(db, 'users', userId, 'operations', editingOperation.id), operationData);
            } else {
                await addDoc(collection(db, 'users', userId, 'operations'), operationData);
            }

            onClose();

            if (!editingOperation) {
                form.reset({
                    type: defaultType,
                    amount: 0,
                    description: '',
                    categoryId: '',
                    date: new Date()
                });
            }
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedType = form.watch('type');

    const typeConfig = {
        expense: {
            title: editingOperation ? 'Modifier la dépense' : 'Nouvelle dépense',
            icon: TrendingDown,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200'
        },
        income: {
            title: editingOperation ? 'Modifier le revenu' : 'Nouveau revenu',
            icon: TrendingUp,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        }
    };

    const config = typeConfig[selectedType];
    const Icon = config.icon;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className={`p-2 rounded-full ${config.bgColor}`}>
                            <Icon className={`w-5 h-5 ${config.color}`}/>
                        </div>
                        {config.title}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                    {!editingOperation && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    type="button"
                                    variant={selectedType === 'income' ? 'default' : 'outline'}
                                    onClick={() => form.setValue('type', 'income')}
                                    className="justify-start"
                                >
                                    <TrendingUp className="w-4 h-4 mr-2"/>
                                    Revenu
                                </Button>
                                <Button
                                    type="button"
                                    variant={selectedType === 'expense' ? 'default' : 'outline'}
                                    onClick={() => form.setValue('type', 'expense')}
                                    className="justify-start"
                                >
                                    <TrendingDown className="w-4 h-4 mr-2"/>
                                    Dépense
                                </Button>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            <DollarSign className="inline w-4 h-4 mr-1"/>
                            Montant (€)
                        </label>
                        <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            disabled={isSubmitting}
                            className={form.formState.errors.amount ? 'border-red-500' : ''}
                            {...form.register('amount', {valueAsNumber: true})}
                        />
                        {form.formState.errors.amount && (
                            <p className="text-red-600 text-sm mt-1">
                                {form.formState.errors.amount.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Catégorie (optionnel)
                        </label>
                        <CategorySelector
                            value={form.watch('categoryId') || ''}
                            onChange={(value) => form.setValue('categoryId', value)}
                            operationType={selectedType}
                            userId={userId}
                        />
                        {form.formState.errors.categoryId && (
                            <p className="text-red-600 text-sm mt-1">
                                {form.formState.errors.categoryId.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            <FileText className="inline w-4 h-4 mr-1"/>
                            Description
                        </label>
                        <Input
                            placeholder="Description de l'opération..."
                            disabled={isSubmitting}
                            className={form.formState.errors.description ? 'border-red-500' : ''}
                            {...form.register('description')}
                        />
                        {form.formState.errors.description && (
                            <p className="text-red-600 text-sm mt-1">
                                {form.formState.errors.description.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                            <Calendar className="inline w-4 h-4 mr-1"/>
                            Date
                        </label>
                        <Input
                            type="date"
                            disabled={isSubmitting}
                            className={form.formState.errors.date ? 'border-red-500' : ''}
                            defaultValue={format(new Date(), 'yyyy-MM-dd')}
                            {...form.register('date', {valueAsDate: true})}
                        />
                        {form.formState.errors.date && (
                            <p className="text-red-600 text-sm mt-1">
                                {form.formState.errors.date.message}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || !form.formState.isValid}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            {editingOperation ? 'Modifier' : 'Ajouter'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
