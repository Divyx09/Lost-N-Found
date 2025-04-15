import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "../components/auth/Login";
import Register from "../components/auth/Register";
import ForgotPassword from "../components/auth/ForgotPassword";
import ResetPassword from "../components/auth/ResetPassword";
import PrivateRoute from "./PrivateRoute";
import Dashboard from "../components/Dashboard";
import AdminDashboard from "../components/admin/AdminDashboard";
import Navigation from "../components/Navigation";
import { AuthProvider } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import UserDashboard from "../components/user/UserDashboard";
import HomePage from "../components/pages/HomePage";
import UserProfile from "../components/user/UserProfile";
import MyClaimedItems from "../components/user/MyClaimedItems";

// Wrapper component for public routes
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  // Redirect authenticated users away from public routes
  if (user) {
    return <Navigate to={user.role.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }
  
  return children;
};

function AppRouter() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <Routes>
          {/* Add Homepage Route */}
          <Route path="/homepage" element={<HomePage />} />

          {/* Public Routes with authentication check */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            }
          />
          <Route
            path="/user/claimed-items"
            element={
              <PrivateRoute>
                <MyClaimedItems />
              </PrivateRoute>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />

          <Route
            path="/home"
            element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <UserProfile />
              </PrivateRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/user/dashboard"
            element={
              <PrivateRoute>
                <UserDashboard />
              </PrivateRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/homepage" replace />} />

          {/* Catch all route for undefined paths */}
          <Route path="*" element={<Navigate to="/homepage" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default AppRouter;
