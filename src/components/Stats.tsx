import {useMemo, useState} from 'react';
import {collection} from 'firebase/firestore';
import {useCollection} from 'react-firebase-hooks/firestore';
import {db} from '../firebase';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    Activity,
    ArrowDownRight,
    ArrowUpRight,
    Calendar,
    DollarSign,
    PieChart as PieChartIcon,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import type {Operation} from '@/types';
import {
    eachDayOfInterval,
    eachMonthOfInterval,
    endOfDay,
    endOfMonth,
    endOfWeek,
    endOfYear,
    format,
    startOfDay,
    startOfMonth,
    startOfWeek,
    startOfYear,
    subDays,
    subMonths
} from 'date-fns';

interface Props {
    userId: string;
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'annual';
type ChartType = 'overview' | 'trend' | 'categories' | 'balance';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const Stats = ({userId}: Props) => {
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');
    const [selectedChart, setSelectedChart] = useState<ChartType>('overview');
    const [snapshot] = useCollection(collection(db, `users/${userId}/operations`));
    const operations = useMemo(() =>
            snapshot?.docs.map(doc => ({...doc.data()} as Operation)) || [],
        [snapshot]
    );

    const calculateStats = (period: PeriodType) => {
        const now = new Date();
        let start: Date, end: Date;

        switch (period) {
            case 'daily':
                start = startOfDay(now);
                end = endOfDay(now);
                break;
            case 'weekly':
                start = startOfWeek(now);
                end = endOfWeek(now);
                break;
            case 'monthly':
                start = startOfMonth(now);
                end = endOfMonth(now);
                break;
            case 'annual':
                start = startOfYear(now);
                end = endOfYear(now);
                break;
        }

        const filtered = operations.filter(op =>
            op.timestamp.toDate() >= start && op.timestamp.toDate() <= end
        );

        const income = filtered
            .filter(op => op.type === 'income')
            .reduce((sum, op) => sum + op.amount, 0);

        const expense = filtered
            .filter(op => op.type === 'expense')
            .reduce((sum, op) => sum + op.amount, 0);

        return {income, expense, balance: income - expense, operations: filtered};
    };

    const getTrendData = () => {
        const now = new Date();
        const days = eachDayOfInterval({
            start: subDays(now, 30),
            end: now
        });

        return days.map(day => {
            const dayStart = startOfDay(day);
            const dayEnd = endOfDay(day);
            const dayOps = operations.filter(op => {
                const opDate = op.timestamp.toDate();
                return opDate >= dayStart && opDate <= dayEnd;
            });

            const income = dayOps
                .filter(op => op.type === 'income')
                .reduce((sum, op) => sum + op.amount, 0);

            const expense = dayOps
                .filter(op => op.type === 'expense')
                .reduce((sum, op) => sum + op.amount, 0);

            return {
                date: format(day, 'dd/MM'),
                income,
                expense,
                balance: income - expense
            };
        });
    };

    const getCategoryData = () => {
        const {operations: periodOps} = calculateStats(selectedPeriod);
        const categoryTotals = periodOps.reduce((acc, op) => {
            const category = op.categoryId || 'Non catégorisé';
            if (!acc[category]) {
                acc[category] = {income: 0, expense: 0};
            }
            if (op.type === 'income') {
                acc[category].income += op.amount;
            } else {
                acc[category].expense += op.amount;
            }
            return acc;
        }, {} as Record<string, { income: number; expense: number }>);

        return Object.entries(categoryTotals).map(([category, data]) => ({
            name: category,
            income: data.income,
            expense: data.expense,
            total: data.income + data.expense
        }));
    };

    const getBalanceData = () => {
        const now = new Date();
        const months = eachMonthOfInterval({
            start: subMonths(now, 12),
            end: now
        });

        return months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthOps = operations.filter(op => {
                const opDate = op.timestamp.toDate();
                return opDate >= monthStart && opDate <= monthEnd;
            });

            const income = monthOps
                .filter(op => op.type === 'income')
                .reduce((sum, op) => sum + op.amount, 0);

            const expense = monthOps
                .filter(op => op.type === 'expense')
                .reduce((sum, op) => sum + op.amount, 0);

            return {
                month: format(month, 'MMM yyyy'),
                income,
                expense,
                balance: income - expense
            };
        });
    };

    const periods: { value: PeriodType; label: string }[] = [
        {value: 'daily', label: 'Aujourd\'hui'},
        {value: 'weekly', label: 'Cette semaine'},
        {value: 'monthly', label: 'Ce mois'},
        {value: 'annual', label: 'Cette année'}
    ];

    const chartTypes: { value: ChartType; label: string; icon: any }[] = [
        {value: 'overview', label: 'Vue d\'ensemble', icon: Activity},
        {value: 'trend', label: 'Tendances', icon: TrendingUp},
        {value: 'categories', label: 'Catégories', icon: PieChartIcon},
        {value: 'balance', label: 'Balance', icon: DollarSign}
    ];

    const currentStats = calculateStats(selectedPeriod);
    const trendData = getTrendData();
    const categoryData = getCategoryData();
    const balanceData = getBalanceData();

    const renderChart = () => {
        switch (selectedChart) {
            case 'trend':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="date"/>
                            <YAxis/>
                            <Tooltip
                                formatter={(value: number) => [`${value}€`, '']}
                                labelFormatter={(label) => `Date: ${label}`}
                            />
                            <Legend/>
                            <Area
                                type="monotone"
                                dataKey="income"
                                stackId="1"
                                stroke="#10B981"
                                fill="#10B981"
                                fillOpacity={0.6}
                                name="Revenus"
                            />
                            <Area
                                type="monotone"
                                dataKey="expense"
                                stackId="2"
                                stroke="#EF4444"
                                fill="#EF4444"
                                fillOpacity={0.6}
                                name="Dépenses"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                );

            case 'categories':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={categoryData}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="total"
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {categoryData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => [`${value}€`, 'Total']}/>
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'balance':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={balanceData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="month"/>
                            <YAxis/>
                            <Tooltip formatter={(value: number) => [`${value}€`, '']}/>
                            <Legend/>
                            <Bar dataKey="income" fill="#10B981" name="Revenus"/>
                            <Bar dataKey="expense" fill="#EF4444" name="Dépenses"/>
                        </BarChart>
                    </ResponsiveContainer>
                );

            default:
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3"/>
                            <XAxis dataKey="date"/>
                            <YAxis/>
                            <Tooltip formatter={(value: number) => [`${value}€`, '']}/>
                            <Legend/>
                            <Line
                                type="monotone"
                                dataKey="balance"
                                stroke="#3B82F6"
                                strokeWidth={3}
                                name="Balance"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
        }
    };

    return (
        <div className="space-y-6">
            {/* Contrôles */}
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex gap-2">
                    {periods.map(period => (
                        <Button
                            key={period.value}
                            variant={selectedPeriod === period.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedPeriod(period.value)}
                        >
                            {period.label}
                        </Button>
                    ))}
                </div>

                <div className="flex gap-2">
                    {chartTypes.map(chart => {
                        const Icon = chart.icon;
                        return (
                            <Button
                                key={chart.value}
                                variant={selectedChart === chart.value ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedChart(chart.value)}
                            >
                                <Icon className="w-4 h-4 mr-1"/>
                                {chart.label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-800">
                            Revenus
                        </CardTitle>
                        <ArrowUpRight className="h-4 w-4 text-green-600"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-900">
                            {currentStats.income.toFixed(2)}€
                        </div>
                        <p className="text-xs text-green-600">
                            {periods.find(p => p.value === selectedPeriod)?.label}
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-800">
                            Dépenses
                        </CardTitle>
                        <ArrowDownRight className="h-4 w-4 text-red-600"/>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-900">
                            {currentStats.expense.toFixed(2)}€
                        </div>
                        <p className="text-xs text-red-600">
                            {periods.find(p => p.value === selectedPeriod)?.label}
                        </p>
                    </CardContent>
                </Card>

                <Card className={`bg-gradient-to-br ${
                    currentStats.balance >= 0
                        ? 'from-blue-50 to-blue-100 border-blue-200'
                        : 'from-orange-50 to-orange-100 border-orange-200'
                }`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-sm font-medium ${
                            currentStats.balance >= 0 ? 'text-blue-800' : 'text-orange-800'
                        }`}>
                            Balance
                        </CardTitle>
                        {currentStats.balance >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-blue-600"/>
                        ) : (
                            <TrendingDown className="h-4 w-4 text-orange-600"/>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${
                            currentStats.balance >= 0 ? 'text-blue-900' : 'text-orange-900'
                        }`}>
                            {currentStats.balance.toFixed(2)}€
                        </div>
                        <p className={`text-xs ${
                            currentStats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                            {periods.find(p => p.value === selectedPeriod)?.label}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Graphique principal */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5"/>
                        {chartTypes.find(c => c.value === selectedChart)?.label}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderChart()}
                </CardContent>
            </Card>
        </div>
    );
};