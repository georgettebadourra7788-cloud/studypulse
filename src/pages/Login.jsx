import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Redirect once AuthContext's user state actually updates, rather than
  // right after the sign-in call resolves - onAuthStateChanged fires on its
  // own tick, so navigating immediately here would race it: the route guard
  // could still see the pre-login `user` and bounce straight back to /login.
  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message.replace("Firebase: ", ""));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-gutter-mobile">
      <div className="w-full max-w-sm flex flex-col gap-unit-5">
        <div className="flex flex-col items-center gap-unit-2 text-center">
          <span className="material-symbols-outlined text-primary text-[40px]">monitoring</span>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
            StudyPulse
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Biometric study data, clean stats, and exportable reports.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-unit-3 bg-surface-container-lowest rounded-xl p-unit-5 shadow-sm">
          <div className="flex rounded-lg bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 py-unit-2 rounded-md font-label-lg text-label-lg transition-colors ${
                mode === "signin" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 py-unit-2 rounded-md font-label-lg text-label-lg transition-colors ${
                mode === "signup" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"
              }`}
            >
              Sign Up
            </button>
          </div>

          <label className="flex flex-col gap-unit-1">
            <span className="font-label-md text-label-md text-on-surface-variant">EMAIL</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 px-unit-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          <label className="flex flex-col gap-unit-1">
            <span className="font-label-md text-label-md text-on-surface-variant">PASSWORD</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 px-unit-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </label>

          {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="h-11 rounded-lg bg-primary text-on-primary font-label-lg text-label-lg font-semibold shadow-sm hover:bg-primary-container transition-colors disabled:opacity-60"
          >
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>

          <div className="flex items-center gap-unit-2">
            <div className="h-px flex-1 bg-outline-variant" />
            <span className="font-label-sm text-label-sm text-outline">OR</span>
            <div className="h-px flex-1 bg-outline-variant" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={busy}
            className="h-11 rounded-lg border border-outline-variant text-on-surface font-label-lg text-label-lg flex items-center justify-center gap-unit-2 hover:bg-surface-container-low transition-colors disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
