import {createBrowserRouter, Navigate, type RouteObject} from "react-router";
import {Auth} from "@/pages/Auth.tsx";
import {Dashboard} from "@/pages/Dashboard.tsx";
import {ProtectedRoute} from "@/components/ProtectedRoute.tsx";
import {Overview} from "@/pages/Overview.tsx";
import {History} from "@/pages/History.tsx";

const routes: RouteObject[] = [
    {
        path: '/',
        element: <Navigate to='/dashboard' replace/>
    },
    {
        path: '/dashboard',
        element: <ProtectedRoute><Dashboard/></ProtectedRoute>,
        children: [
            {
                index: true,
                element: <Overview/>
            },
            {
                path: 'history',
                element: <History/>
            }
        ]
    },
    {
        path: '/auth',
        element: <Auth/>
    }
]

export const router = createBrowserRouter(routes)