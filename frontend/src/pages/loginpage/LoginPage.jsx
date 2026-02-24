import { useState } from "react";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "./services/userService";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      // Registration validation
      if (!fullName.trim()) {
        newErrors.fullName = "Full name is required";
      }

      if (!email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Email is invalid";
      }

      if (!password) {
        newErrors.password = "Password is required";
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else {
      // Login validation
      if (!email) {
        newErrors.email = "Email is required";
      }
      if (!password) {
        newErrors.password = "Password is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  if (!validateForm()) {
    return;
  }

  try {
    if (isLogin) {
      // Perform login
      const response = await loginUser(email, password);
      console.log("Login successful:", response);
      
      // ✅ STORE USER INFO IN LOCALSTORAGE HERE (AFTER LOGIN)
      localStorage.setItem('token', response.token);
      localStorage.setItem('userName', response.user.name);
      localStorage.setItem('userEmail', response.user.email);
      localStorage.setItem('userId', response.user.id);
      
      navigate("/page/dashboard");
    } else {
      // Perform registration
      const response = await registerUser(fullName, email, password);
      console.log("Registration successful:", response);
      
      // Store the email and password to prefill after switching
      const registeredEmail = email;
      const registeredPassword = password;
      
      // Clear form but keep email and password for login
      setFullName("");
      setConfirmPassword("");
      setErrors({});

      // Switch to login and prefill email/password
      setIsLogin(true);
      setEmail(registeredEmail);
      setPassword(registeredPassword);
    }
  } catch (err) {
    console.error("Error during submission:", err);
    
    if (err.error === "Email already in use") {
      setErrors({ ...errors, email: "This email is already registered" });
    }
    else if (err.message === "Email already in use") {
      setErrors({ ...errors, email: "This email is already registered" });
    }
    else if (typeof err === 'string' && err.includes("Email already in use")) {
      setErrors({ ...errors, email: "This email is already registered" });
    }
    else if (err.error) {
      setError(err.error);
    } else if (err.message) {
      setError(err.message);
    } else {
      setError("Something went wrong. Please try again.");
    }
  }
};
  return (
    <div className="loginpage">
      <div className="login-card">
        <h1>{isLogin ? "Welcome Back 👋" : "Create Account 🚀"}</h1>
        <p className="subtitle">
          {isLogin
            ? "Login to continue to ContentFlow"
            : "Join ContentFlow and start publishing"}
        </p>

        {error && <p className="error">{error}</p>}

        <form className="form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors({ ...errors, fullName: "" });
                }}
                className={errors.fullName ? "error-input" : ""}
              />
              {errors.fullName && <small className="error-text">{errors.fullName}</small>}
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={errors.email ? "error-input" : ""}
            />
            {errors.email && <small className="error-text">{errors.email}</small>}
          </div>

          <div className="form-group">
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                className={errors.password ? "error-input" : ""}
              />
              <span 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
            {errors.password && <small className="error-text">{errors.password}</small>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                  }}
                  className={errors.confirmPassword ? "error-input" : ""}
                />
                <span 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </span>
              </div>
              {errors.confirmPassword && <small className="error-text">{errors.confirmPassword}</small>}
            </div>
          )}

          <button type="submit">{isLogin ? "Login" : "Register"}</button>
        </form>

        <p className="switch">
          {isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onClick={() => {
            setIsLogin(!isLogin);
            setError("");
            setErrors({});
            setEmail("");
            setPassword("");
            setFullName("");
            setConfirmPassword("");
          }}>
            {isLogin ? " Sign Up" : " Login"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;