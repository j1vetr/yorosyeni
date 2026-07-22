import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MenuProvider } from "@/contexts/menu-context";

// ── Admin (not needed until user navigates to /admin) ─────────────
const AdminLogin      = lazy(() => import("@/pages/admin/login"));
const AdminLayout     = lazy(() => import("@/pages/admin/layout"));
const AdminDashboard  = lazy(() => import("@/pages/admin/dashboard"));
const AdminCategories = lazy(() => import("@/pages/admin/categories"));
const AdminProducts   = lazy(() => import("@/pages/admin/products"));
const AdminSettings   = lazy(() => import("@/pages/admin/settings"));
const AdminImport     = lazy(() => import("@/pages/admin/import-page"));

// ── Menu (each route gets its own chunk) ──────────────────────────
const HomePage           = lazy(() => import("@/pages/menu/home-page"));
const CategoriesPage     = lazy(() => import("@/pages/menu/categories-page"));
const CategoryDetailPage = lazy(() => import("@/pages/menu/category-detail-page"));
const ProductDetailPage  = lazy(() => import("@/pages/menu/product-detail-page"));
const LanguagePage       = lazy(() => import("@/pages/menu/language-page"));
const NotFound           = lazy(() => import("@/pages/not-found"));

// Minimal fallback — dark screen that matches the menu theme
const PageFallback = () => <div className="min-h-screen bg-[#0A0A0A]" />;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/admin/login" component={AdminLogin} />

        <Route path="/admin/categories">
          {() => (
            <AdminLayout>
              <AdminCategories />
            </AdminLayout>
          )}
        </Route>

        <Route path="/admin/products">
          {() => (
            <AdminLayout>
              <AdminProducts />
            </AdminLayout>
          )}
        </Route>

        <Route path="/admin/settings">
          {() => (
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          )}
        </Route>

        <Route path="/admin/import">
          {() => (
            <AdminLayout>
              <AdminImport />
            </AdminLayout>
          )}
        </Route>

        <Route path="/admin">
          {() => (
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          )}
        </Route>

        {/* Menu routes — flat, no nesting to avoid wouter v3 splat issues */}
        <Route path="/categories/:categorySlug/:productSlug" component={ProductDetailPage} />
        <Route path="/categories/:categorySlug" component={CategoryDetailPage} />
        <Route path="/categories" component={CategoriesPage} />
        <Route path="/language" component={LanguagePage} />
        <Route path="/" component={HomePage} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MenuProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </MenuProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
