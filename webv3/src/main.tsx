import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SnackbarProvider } from "notistack";
import { UserProvider } from "./context/UserContext.tsx";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { QueryClient, QueryClientProvider } from "react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider maxSnack={3}>
        <UserProvider>
          <App />
        </UserProvider>
      </SnackbarProvider>
    </QueryClientProvider>
  </StrictMode>
);
