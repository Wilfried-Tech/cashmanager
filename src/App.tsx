import {Toaster} from "@/components/ui/sonner.tsx";
import {RouterProvider} from "react-router";
import {router} from "@/router.tsx";
import {UserProvider} from "@/contexts/user-provider.tsx";

function App() {
    return (
        <UserProvider>
            <div className="min-h-screen bg-background">
                <RouterProvider router={router}/>
                <Toaster richColors/>
            </div>
        </UserProvider>
    )
}

export default App
