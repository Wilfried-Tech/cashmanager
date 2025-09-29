import {Stats} from "@/components/Stats.tsx";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card.tsx";
import {Button} from "@/components/ui/button.tsx";
import {List, TrendingDown, TrendingUp} from "lucide-react";
import {useUser} from "@/contexts/user-provider.tsx";
import {useNavigate} from "react-router";
import {useEffect, useState} from "react";
import type {Category, Operation} from "@/types.ts";
import {collection, onSnapshot, orderBy, query} from "firebase/firestore";
import {db} from "@/firebase.ts";

export const Overview = () => {
    const [operations, setOperations] = useState<Operation[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const navigate = useNavigate()
    const {user} = useUser();
    const userId = user!.uid;

    useEffect(() => {
        const operationsQuery = query(
            collection(db, 'users', userId, 'operations'),
            orderBy('timestamp', 'desc')
        );

        const categoriesQuery = query(
            collection(db, 'users', userId, 'categories'),
            orderBy('name')
        );

        const unsubscribeOperations = onSnapshot(operationsQuery, (snapshot) => {
            const ops = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Operation));
            setOperations(ops);
        });

        const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
            const cats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Category));
            setCategories(cats);
        });

        return () => {
            unsubscribeOperations();
            unsubscribeCategories();
        };
    }, [userId]);

    const categoriesMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
    }, {} as { [id: string]: string });

    const recentOperations = operations.slice(0, 5);

    return <>
        <div className="mb-8">
            <Stats userId={userId}/>
        </div>
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Opérations récentes</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => navigate('history')}>
                        <List className="w-4 h-4 mr-2"/>
                        Voir tout
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {recentOperations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Aucune opération enregistrée</p>
                        <p className="text-sm">Commencez par ajouter votre première opération</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentOperations.map((operation) => (
                            <div
                                key={operation.id}
                                className="flex items-center justify-between p-3 bg-accent/30 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    {operation.type === 'income' ? (
                                        <TrendingUp className="w-5 h-5 text-green-600"/>
                                    ) : (
                                        <TrendingDown className="w-5 h-5 text-red-600"/>
                                    )}
                                    <div>
                                        <p className="font-medium text-foreground">{operation.description}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {operation.categoryId && categoriesMap[operation.categoryId] && (
                                                <span
                                                    className="inline-block bg-secondary px-2 py-0.5 rounded text-xs mr-2">
                                                    {categoriesMap[operation.categoryId]}
                                                </span>
                                            )}
                                            {operation.timestamp.toDate().toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className={`font-semibold ${
                                    operation.type === 'income' ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {operation.type === 'income' ? '+' : '-'}{operation.amount.toFixed(2)}€
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    </>
}