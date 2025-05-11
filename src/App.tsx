import { lazy } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import routes from "tempo-routes";
import { AuthProvider } from "./components/auth/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/layout/Layout";

// Lazy load components for better performance
const Home = lazy(() => import("./components/home"));
const DonationForm = lazy(() => import("./components/DonationForm"));
const DonationDashboard = lazy(() => import("./components/DonationDashboard"));
const DonationTracker = lazy(() => import("./components/DonationTracker"));
const NotificationCenter = lazy(
  () => import("./components/NotificationCenter"),
);
const LoginForm = lazy(() => import("./components/auth/LoginForm"));
const RegisterForm = lazy(() => import("./components/auth/RegisterForm"));
const ProfilePage = lazy(() => import("./components/profile/ProfilePage"));
const UnauthorizedPage = lazy(
  () => import("./components/auth/UnauthorizedPage"),
);

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route
            path="/donate"
            element={
              <ProtectedRoute>
                <DonationForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DonationDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/track/:donationId"
            element={
              <ProtectedRoute>
                <DonationTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationCenter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Add a catch-all route that redirects to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Allow Tempo routes */}
        {import.meta.env.VITE_TEMPO === "true" && <Route path="/tempobook/*" />}
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
    </AuthProvider>
  );
}

export default App;
