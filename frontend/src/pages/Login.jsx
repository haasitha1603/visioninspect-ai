import React, { useState } from "react";

const Login = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("QUALITY_ENGINEER");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    const endpoint = isRegistering ? "http://127.0.0.1:8000/auth/register" : "http://127.0.0.1:8000/auth/login";
    const payload = isRegistering ? { name, email, password, role } : { email, password };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed");
      }

      if (isRegistering) {
        setMessage({ type: "success", text: "Registration successful! You can now log in." });
        setIsRegistering(false);
      } else {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify({
          id: data.user_id,
          name: data.name,
          role: data.role
        }));
        setMessage({ type: "success", text: `Welcome back, ${data.name}!` });
        if (onLoginSuccess) {
          onLoginSuccess(data);
        }
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-badge">VISIONINSPECT AI</div>
          <h2>{isRegistering ? "Register Inspector Account" : "Sign In to Industrial Platform"}</h2>
          <p>Access quality inspection dashboards, CV models, and defect analytics.</p>
        </div>

        {message && (
          <div className={`auth-alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegistering && (
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="inspector@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isRegistering && (
            <div className="form-group">
              <label>System Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="QUALITY_ENGINEER">Quality Engineer</option>
                <option value="FACTORY_SUPERVISOR">Factory Supervisor</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Processing..." : isRegistering ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="auth-toggle">
          {isRegistering ? (
            <p>
              Already have an account?{" "}
              <button type="button" onClick={() => setIsRegistering(false)}>Sign In</button>
            </p>
          ) : (
            <p>
              Don't have an account?{" "}
              <button type="button" onClick={() => setIsRegistering(true)}>Register</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
