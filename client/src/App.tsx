import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Map from "@/pages/Map";
import Search from "@/pages/Search";
import Recycle from "@/pages/Recycle";
import RecycleMaterial from "@/pages/RecycleMaterial";
import Schedule from "@/pages/Schedule";
import ScheduleList from "@/pages/ScheduleList";
import ScheduleCancel from "@/pages/ScheduleCancel";
import ScheduleSuccess from "@/pages/ScheduleSuccess";
import UserProfileSimple from "@/pages/UserProfileSimple";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import InstallPrompt from "./components/InstallPrompt";
import { Helmet } from "react-helmet";

// Páginas de autenticação
import Welcome from "@/pages/Welcome";
import Login from "@/pages/Login";
import Register1 from "@/pages/Register1";
import Register2 from "@/pages/Register2";
import RegisterSuccess from "@/pages/RegisterSuccess";
import ForgotPassword from "@/pages/ForgotPassword";
import VerifyCode from "@/pages/VerifyCode";
import ResetPassword from "@/pages/ResetPassword";
import ResetSuccess from "@/pages/ResetSuccess";
import { useEffect, useState } from "react";

// Componente de redirecionamento simples
function RedirectComponent({ redirectTo }: { redirectTo: string }) {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation(redirectTo);
  }, [redirectTo, setLocation]);

  return <div>Redirecionando...</div>;
}

// Verificador de autenticação
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
    const user = localStorage.getItem("recycleczs_current_user");
      console.log('Verificando autenticação do usuário...');
      if (user) {
        const parsedUser = JSON.parse(user);
        console.log('Usuário encontrado:', parsedUser ? { id: parsedUser.id, username: parsedUser.username } : null);
        setIsAuthenticated(true);
      } else {
        console.log('Nenhum usuário encontrado no localStorage');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
    setLoading(false);
    }
  }, []);

  return { isAuthenticated, loading };
}

// Verificador de autenticação para administradores
function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar primeiro no storage de admin específico
    const adminUser = localStorage.getItem("recycleczs_admin_user");
    console.log('Verificando autenticação de administrador...');

    if (adminUser) {
      try {
        const user = JSON.parse(adminUser);
        console.log('Usuário admin encontrado:', user ? { id: user.id, username: user.username, role: user.role } : null);

        if (user && user.role === 'admin') {
          console.log('Usuário tem papel de administrador');
          setIsAdmin(true);
          setLoading(false);
          return;
        } else {
          console.log('Usuário existe mas não tem papel de administrador:', user?.role);
          setIsAdmin(false);
        }
      } catch (e) {
        console.error('Erro ao analisar dados do administrador:', e);
        setIsAdmin(false);
      }
    } else {
      console.log('Nenhum usuário admin encontrado em recycleczs_admin_user');
    }

    // Se não encontrar, verificar no storage normal de usuário
    const regularUser = localStorage.getItem("recycleczs_current_user");
    if (regularUser) {
      try {
        const user = JSON.parse(regularUser);
        console.log('Usuário regular encontrado:', user ? { id: user.id, username: user.username, role: user.role } : null);

        if (user && user.role === 'admin') {
          console.log('Usuário regular tem papel de administrador');
          setIsAdmin(true);
        } else {
          console.log('Usuário regular não tem papel de administrador:', user?.role);
          setIsAdmin(false);
        }
      } catch (e) {
        console.error('Erro ao analisar dados do usuário regular:', e);
        setIsAdmin(false);
      }
    } else {
      console.log('Nenhum usuário encontrado em recycleczs_current_user');
      setIsAdmin(false);
    }

    setLoading(false);
  }, []);

  return { isAdmin, loading };
}

// Componente para verificar rota autenticada
function AuthCheck({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !hasRedirected) {
      console.log('Usuário não autenticado, redirecionando para /welcome');
      setHasRedirected(true);
      setLocation("/welcome");
    }
  }, [isAuthenticated, loading, setLocation, hasRedirected]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? <>{children}</> : null;
}

// Componente para verificar rota de administrador
function AdminAuthCheck({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { isAdmin, loading } = useAdminAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin && !hasRedirected) {
      console.log('Usuário não é administrador. Redirecionando para /admin-login');
      setHasRedirected(true);
      setLocation("/admin-login");
    }
  }, [isAdmin, loading, setLocation, hasRedirected]);

  if (loading) {
    return <div>Carregando painel administrativo...</div>;
  }

  return isAdmin ? <>{children}</> : null;
}

// Componente para a página inicial
function IndexRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? <Home /> : <Welcome />;
}

function Router() {
  return (
    <Switch>
      {/* Página principal do app (verificação condicional) */}
      <Route path="/" component={IndexRoute} />

      {/* Páginas de autenticação (públicas) */}
      <Route path="/welcome" component={Welcome} />
      <Route path="/login" component={Login} />
      <Route path="/admin-login" component={AdminLogin} />
      <Route path="/register" component={Register1} />
      <Route path="/register-step2" component={Register2} />
      <Route path="/register-success" component={RegisterSuccess} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-code" component={VerifyCode} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/reset-success" component={ResetSuccess} />

      {/* Painel admin - rota alternativa */}
      <Route path="/admin-dashboard">
        <AdminAuthCheck>
          <AdminDashboard />
        </AdminAuthCheck>
      </Route>

      {/* Páginas principais da aplicação (protegidas) */}
      <Route path="/home">
        <AuthCheck>
          <Home />
        </AuthCheck>
      </Route>
      <Route path="/admin">
        <AuthCheck>
          <AdminAuthCheck>
            <AdminDashboard />
          </AdminAuthCheck>
        </AuthCheck>
      </Route>
      <Route path="/map">
        <AuthCheck>
          <Map />
        </AuthCheck>
      </Route>
      <Route path="/search">
        <AuthCheck>
          <Search />
        </AuthCheck>
      </Route>
      <Route path="/recycle">
        <AuthCheck>
          <Recycle />
        </AuthCheck>
      </Route>
      <Route path="/recycle/:materialId">
        {(params) => (
          <AuthCheck>
            <RecycleMaterial materialId={params.materialId} />
          </AuthCheck>
        )}
      </Route>
      <Route path="/schedule">
        <AuthCheck>
          <Schedule />
        </AuthCheck>
      </Route>
      <Route path="/schedule/list">
        <AuthCheck>
          <ScheduleList />
        </AuthCheck>
      </Route>
      <Route path="/schedule/cancel/:id">
        {(params) => (
          <AuthCheck>
            <ScheduleCancel id={params.id} />
          </AuthCheck>
        )}
      </Route>
      <Route path="/schedule/success">
        <AuthCheck>
          <ScheduleSuccess />
        </AuthCheck>
      </Route>
      <Route path="/user/profile">
        <AuthCheck>
          <UserProfileSimple />
        </AuthCheck>
      </Route>

      {/* Página 404 */}
      <Route component={NotFound} />
    </Switch >
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Helmet>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#6CB33F" />
      </Helmet>
      {/* Resto do seu componente */}
      <InstallPrompt />
      <Toaster />
      <Router />
    </QueryClientProvider>
  );
}

export default App;
