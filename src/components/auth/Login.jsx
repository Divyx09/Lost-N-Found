import { useForm } from "react-hook-form";
import { useState } from "react";
import { Card, Form, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setLoginError("");

      const response = await fetch("http://localhost:8080/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: data.email,
          password: data.password
        }),
      });

      if (!response.ok) {
        throw new Error("Login failed. Please check your credentials.");
      }

      const responseData = await response.json();
      console.log(responseData);

      // Create a user object with all necessary data
      const userData = {
        email: data.email,
        token: responseData.token,
        name: responseData.name,
        role: responseData.role,
        isActive: true
      };

      // Use the login function from AuthContext with the complete user data
      await login(userData);

      localStorage.setItem("token", responseData.token);
      localStorage.setItem("token", responseData.token);
      localStorage.setItem("role",responseData.role);
      localStorage.setItem("name",responseData.name);

      // Role-based navigation
      if (responseData.role.toLowerCase() === 'admin') {
        localStorage.getItem("admin",{
          firstName: "Sameer",
          lastName: "Khatri",
          email: "admin@gmail.com",
          phoneNumber: "9111045198",
          address: "59/3 shiv bagh colony Khajrana, Indore M.P. India",
        });
        navigate('/admin/dashboard');
      } else {
        localStorage.getItem("user",{firstName: "Sameer", lastName: "Khatri", email: "sameer.khatri2022@sait.ac.in", phoneNumber: "9111045198",address
: 
"59/3 shiv bagh colony Khajrana, Indore M.P. India"
      })
        navigate('/user/dashboard'); // Make sure this matches the route path

      }

    } catch (error) {
      setLoginError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <Card className="auth-card">
        <Card.Body>
          <div className="auth-header">
            <h2>Welcome Back</h2>
            <p>Please sign in to continue</p>
          </div>

          {loginError && (
            <Alert variant="danger" className="mb-4">
              {loginError}
            </Alert>
          )}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                isInvalid={!!errors.email}
                disabled={isLoading}
              />
              {errors.email && (
                <Form.Control.Feedback type="invalid">
                  {errors.email.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                isInvalid={!!errors.password}
                disabled={isLoading}
              />
              {errors.password && (
                <Form.Control.Feedback type="invalid">
                  {errors.password.message}
                </Form.Control.Feedback>
              )}
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <Form.Check
                type="checkbox"
                label="Remember me"
                {...register("rememberMe")}
                disabled={isLoading}
              />
              <Link to="/forgot-password" className="text-primary text-decoration-none">
                Forgot Password?
              </Link>
            </div>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <div className="text-center">
              <p className="mb-0">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary text-decoration-none">
                  Register here
                </Link>
              </p>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Login;
