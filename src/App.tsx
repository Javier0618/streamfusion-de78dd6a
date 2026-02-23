import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ContentPage from "./pages/ContentPage";
import WatchPage from "./pages/WatchPage";
import MoviesPage from "./pages/MoviesPage";
import SeriesPage from "./pages/SeriesPage";
import LoginPage from "./pages/LoginPage";
import MessagesPage from "./pages/MessagesPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import CategoryPage from "./pages/CategoryPage";
import SearchPage from "./pages/SearchPage";
import AnimesPage from "./pages/AnimesPage";
import DoramasPage from "./pages/DoramasPage";
import NotFound from "./pages/NotFound";
import { FaAndroid } from "react-icons/fa";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AnalyticsTracker />
          <div className="min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/movies" element={<MoviesPage />} />
              <Route path="/series" element={<SeriesPage />} />
              <Route path="/animes" element={<AnimesPage />} />
              <Route path="/doramas" element={<DoramasPage />} />
              <Route path="/category/:type" element={<CategoryPage />} />
              <Route path="/pelicula/:slug" element={<ContentPage />} />
              <Route path="/serie/:slug" element={<ContentPage />} />
              {/* Backward-compat redirect */}
              <Route path="/content/:id" element={<ContentPage />} />
              <Route path="/watch/:id" element={<WatchPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>

            {/* Android App Link - Fixed Bottom Left */}
            <a
              href="https://streamfusion.top/down/AI2KOBT1bNck.apk"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 left-6 z-[60] flex items-center justify-center w-14 h-14 bg-[#3DDC84] rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 group hover:shadow-[#3DDC84]/20"
              title="Descargar App Android"
              data-testid="link-android-app"
            >
              <FaAndroid 
                className="w-8 h-8 text-white group-hover:animate-pulse" 
                data-testid="icon-android"
              />
            </a>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;