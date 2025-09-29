import {useMemo, useState} from 'react';
import {Check, ChevronsUpDown, Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from '@/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {addDoc, collection, orderBy, query, Timestamp, where} from 'firebase/firestore';
import {db} from '../firebase';
import type {Category} from '../types';
import {cn} from '@/lib/utils';
import {useCollection} from "react-firebase-hooks/firestore";

interface CategorySelectorProps {
    value: string;
    onChange: (value: string) => void;
    operationType: 'income' | 'expense';
    userId: string;
}

export const CategorySelector = ({
                                     value,
                                     onChange,
                                     operationType,
                                     userId,
                                 }: CategorySelectorProps) => {
    const [open, setOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<'income' | 'expense'>(operationType);
    const [loading, setLoading] = useState(false);

    const [categoriesData] = useCollection(
        query(
            collection(db, 'users', userId, 'categories'),
            where('type', '==', operationType),
            orderBy('name')
        )
    );

    const categories = useMemo(() => {
        if (!categoriesData) return [];
        return categoriesData.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Category));
    }, [categoriesData]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;

        try {
            setLoading(true);
            const categoryData = {
                name: newCategoryName.trim(),
                type: newCategoryType,
                createdAt: Timestamp.now()
            };

            const docRef = await addDoc(collection(db, 'users', userId, 'categories'), categoryData);

            if (newCategoryType === operationType) {
                onChange(docRef.id);
            }

            setNewCategoryName('');
            setNewCategoryType(operationType);
            setDialogOpen(false);
            setOpen(false);
        } catch (error) {
            console.error('Erreur lors de l\'ajout de la catégorie:', error);
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = categories.find(cat => cat.id === value);

    return (
        <div className="flex gap-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="flex-1 justify-between"
                    >
                        {selectedCategory ? selectedCategory.name : "Sélectionner une catégorie..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50"/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Rechercher une catégorie..."/>
                        <CommandList>
                            <CommandEmpty>
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Aucune catégorie trouvée.
                                    </p>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {categories.map((category) => (
                                    <CommandItem
                                        key={category.id}
                                        value={category.name}
                                        onSelect={() => {
                                            onChange(value === category.id ? "" : category.id);
                                            setOpen(false);
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === category.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {category.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Plus className="h-4 w-4"/>
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouvelle catégorie</DialogTitle>
                    </DialogHeader>
                    <AddCategoryForm
                        newCategoryName={newCategoryName}
                        setNewCategoryName={setNewCategoryName}
                        newCategoryType={newCategoryType}
                        setNewCategoryType={setNewCategoryType}
                        handleAddCategory={handleAddCategory}
                        setDialogOpen={setDialogOpen}
                        loading={loading}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
};

interface AddCategoryFormProps {
    newCategoryName: string;
    setNewCategoryName: (name: string) => void;
    newCategoryType: 'income' | 'expense';
    setNewCategoryType: (type: 'income' | 'expense') => void;
    handleAddCategory: () => void;
    setDialogOpen: (open: boolean) => void;
    loading: boolean;
}

const AddCategoryForm = ({
                             newCategoryName,
                             setNewCategoryName,
                             newCategoryType,
                             setNewCategoryType,
                             handleAddCategory,
                             setDialogOpen,
                             loading
                         }: AddCategoryFormProps) => {
    return (
        <div className="space-y-4 pt-4">
            <div>
                <label className="text-sm font-medium">Nom de la catégorie</label>
                <Input
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Alimentation, Transport..."
                    className="mt-1"
                />
            </div>
            <div>
                <label className="text-sm font-medium">Type</label>
                <Select value={newCategoryType} onValueChange={setNewCategoryType}>
                    <SelectTrigger className="mt-1">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="income">Revenu</SelectItem>
                        <SelectItem value="expense">Dépense</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={loading}
                >
                    Annuler
                </Button>
                <Button
                    onClick={handleAddCategory}
                    disabled={loading || !newCategoryName.trim()}
                >
                    {loading ? 'Ajout...' : 'Ajouter'}
                </Button>
            </div>
        </div>
    );
};
