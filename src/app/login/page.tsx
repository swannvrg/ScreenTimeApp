"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [password, setPass] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoad] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoad(true);
    setError("");
    setTimeout(() => {
      const ok = login(url.trim(), password);
      if (!ok) {
        setError("Mot de passe incorrect.");
        setLoad(false);
      } else router.replace("/");
    }, 500);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0d0d1a 0%, #0a1628 50%, #0d0d1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Orbs décoratifs */}
      <div
        style={{
          position: "fixed",
          top: "15%",
          left: "10%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(110,231,183,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          bottom: "15%",
          right: "10%",
          width: 250,
          height: 250,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="fade-up"
        style={{
          width: "100%",
          maxWidth: 400,
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 20,
              background: "linear-gradient(135deg, #6ee7b7, #3b82f6)",
              marginBottom: 20,
              fontSize: 28,
            }}
          >
            📱
          </div>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              margin: 0,
              color: "#f0f0ff",
            }}
          >
            Screen
            <span
              style={{
                background: "linear-gradient(135deg, #6ee7b7, #3b82f6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Time
            </span>
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "rgba(255,255,255,0.4)",
              marginTop: 8,
            }}
          >
            Gamification Dashboard
          </p>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ borderRadius: 28 }}>
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: 16 }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 8,
                }}
              >
                Apps Script URL
              </label>
              <input
                className="field"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://script.google.com/macros/s/…/exec"
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: 8,
                }}
              >
                Mot de passe
              </label>
              <input
                className="field"
                type="password"
                value={password}
                onChange={(e) => setPass(e.target.value)}
                required
                placeholder="••••••••••••"
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(255,59,92,0.12)",
                  border: "1px solid rgba(255,59,92,0.3)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#ff8fa3",
                }}
              >
                {error}
              </div>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={loading}
              style={{ marginTop: 4 }}
            >
              {loading ? "..." : "Accéder →"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
