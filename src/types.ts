import {Timestamp} from 'firebase/firestore';

export type Category = {
    id: string;
    name: string;
    type: 'expense' | 'income';
    createdAt?: Timestamp;
}

export type Operation = {
    id: string;
    amount: number;
    categoryId: string;
    description: string;
    timestamp: Timestamp;
    type: 'expense' | 'income';
    createdAt?: Timestamp;
}