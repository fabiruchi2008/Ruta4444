import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Catalogo from "./pages/Catalogo";
import Servicios from "./pages/Servicios";
import Contacto from "./pages/Contacto";
import Admin from "./pages/Admin";
import VehicleDetail from "./pages/VehicleDetail";
import Seguimiento from "./pages/Seguimiento";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/catalogo" component={Catalogo} />
      <Route path="/servicios" component={Servicios} />
      <Route path="/contacto" component={Contacto} />
      <Route path="/admin" component={Admin} />
      <Route path="/vehiculo/:id" component={VehicleDetail} />
      <Route path="/seguimiento" component={Seguimiento} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Navbar />
          <Router />
          <Footer />
          <WhatsAppButton />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
