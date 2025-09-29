import {type ReactNode, useMemo, useState} from 'react';
import {collection, deleteDoc, doc, orderBy, query} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {db} from '../firebase';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {
    ArrowUpDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Edit,
    Eye,
    Filter,
    Search,
    Trash2,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import type {Operation} from '../types';
import {endOfDay, format, isWithinInterval, startOfDay} from 'date-fns';
import {toast} from "sonner";
import {useUser} from '@/contexts/user-provider';

interface Props {
    categories: { [id: string]: string };
    onEdit?: (operation: Operation) => void;
}

type SortField = 'timestamp' | 'amount' | 'description' | 'categoryId';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'expense' | 'income';

export const OperationsList = ({categories, onEdit}: Props) => {
    const {user} = useUser();
    const userId = user!.uid;

    const [filterType, setFilterType] = useState<FilterType>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortField, setSortField] = useState<SortField>('timestamp');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const q = query(
        collection(db, `users/${userId}/operations`),
        orderBy('timestamp', 'desc')
    );

    const [snapshot, loading] = useCollection(q);
    const allOperations = snapshot?.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Operation)) || [];

    const filteredAndSortedOperations = useMemo(() => {
        let filtered = allOperations;

        if (filterType !== 'all') {
            filtered = filtered.filter(op => op.type === filterType);
        }

        if (searchTerm) {
            filtered = filtered.filter(op =>
                op.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (categories[op.categoryId] && categories[op.categoryId].toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(op => op.categoryId === selectedCategory);
        }

        if (dateFrom || dateTo) {
            filtered = filtered.filter(op => {
                const opDate = op.timestamp.toDate();
                const from = dateFrom ? startOfDay(new Date(dateFrom)) : new Date('1900-01-01');
                const to = dateTo ? endOfDay(new Date(dateTo)) : new Date('2100-12-31');

                return isWithinInterval(opDate, {start: from, end: to});
            });
        }

        filtered.sort((a, b) => {
            let aValue: any = a[sortField];
            let bValue: any = b[sortField];

            if (sortField === 'timestamp') {
                aValue = a.timestamp.toDate().getTime();
                bValue = b.timestamp.toDate().getTime();
            } else if (sortField === 'categoryId') {
                aValue = categories[a.categoryId] || 'Non catégorisé';
                bValue = categories[b.categoryId] || 'Non catégorisé';
            }

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

        return filtered;
    }, [allOperations, searchTerm, selectedCategory, dateFrom, dateTo, sortField, sortDirection, filterType, categories]);

    const totalPages = Math.ceil(filteredAndSortedOperations.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedOperations = filteredAndSortedOperations.slice(startIndex, startIndex + itemsPerPage);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const handleDelete = async (operationId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette opération ?')) return;

        try {
            await deleteDoc(doc(db, `users/${userId}/operations`, operationId));
            toast.success('Opération supprimée avec succès');
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            toast.error('Erreur lors de la suppression de l\'opération');
        }
    };

    const resetFilters = () => {
        setFilterType('all');
        setSearchTerm('');
        setSelectedCategory('all');
        setDateFrom('');
        setDateTo('');
        setCurrentPage(1);
    };

    const getUniqueCategories = () => {
        const cats = [...new Set(allOperations.map(op => op.categoryId).filter(Boolean))];
        return cats.sort();
    };

    const SortButton = ({field, children}: { field: SortField; children: ReactNode }) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort(field)}
            className="h-8 px-2 lg:px-3"
        >
            {children}
            <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>
    );

    if (loading) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Chargement des opérations...</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="w-5 h-5"/>
                        Filtres et Recherche
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                <Search className="inline w-4 h-4 mr-1"/>
                                Rechercher
                            </label>
                            <Input
                                placeholder="Description, catégorie..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                            <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous</SelectItem>
                                    <SelectItem value="income">Revenus</SelectItem>
                                    <SelectItem value="expense">Dépenses</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Catégorie</label>
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes</SelectItem>
                                    {getUniqueCategories().map(catId => (
                                        <SelectItem key={catId} value={catId}>
                                            {categories[catId] || catId}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-foreground">
                                <Calendar className="inline w-4 h-4 mr-1"/>
                                Période
                            </label>
                            <div className="space-y-2">
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    placeholder="Du..."
                                />
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    placeholder="Au..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                            {filteredAndSortedOperations.length} opération(s) trouvée(s)
                        </p>
                        <Button variant="outline" onClick={resetFilters}>
                            Réinitialiser les filtres
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Opérations</CardTitle>
                </CardHeader>
                <CardContent>
                    {paginatedOperations.length === 0 ? (
                        <div className="text-center py-8">
                            <Eye className="mx-auto h-12 w-12 text-muted-foreground"/>
                            <h3 className="mt-2 text-sm font-medium text-foreground">Aucune opération</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Aucune opération ne correspond à vos critères de recherche.
                            </p>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>
                                            <SortButton field="timestamp">Date</SortButton>
                                        </TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>
                                            <SortButton field="amount">Montant</SortButton>
                                        </TableHead>
                                        <TableHead>
                                            <SortButton field="categoryId">Catégorie</SortButton>
                                        </TableHead>
                                        <TableHead>
                                            <SortButton field="description">Description</SortButton>
                                        </TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedOperations.map(operation => (
                                        <TableRow key={operation.id} className="hover:bg-accent/50">
                                            <TableCell>
                                                {format(operation.timestamp.toDate(), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {operation.type === 'income' ? (
                                                        <>
                                                            <TrendingUp className="w-4 h-4 text-green-600"/>
                                                            <span className="text-green-600 font-medium">Revenu</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <TrendingDown className="w-4 h-4 text-red-600"/>
                                                            <span className="text-red-600 font-medium">Dépense</span>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className={`font-semibold ${
                                                operation.type === 'income' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                                {operation.type === 'income' ? '+' : '-'}{operation.amount.toFixed(2)}€
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                                                    {categories[operation.categoryId] || 'Non catégorisé'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">
                                                {operation.description}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {onEdit && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => onEdit(operation)}
                                                        >
                                                            <Edit className="w-4 h-4"/>
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(operation.id)}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="w-4 h-4"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {totalPages > 1 && (
                                <div className="mt-4 flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">
                                        Page {currentPage} sur {totalPages}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="w-4 h-4"/>
                                            Précédent
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            Suivant
                                            <ChevronRight className="w-4 h-4"/>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};