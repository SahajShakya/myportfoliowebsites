import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import './index.css'
import App from './App.jsx'
import { SnackbarProvider } from 'notistack';
import { UserProvider } from "./context/UserContext.jsx";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider maxSnack={3}>
        <UserProvider>
          <App />
        </UserProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  </StrictMode>,
)
