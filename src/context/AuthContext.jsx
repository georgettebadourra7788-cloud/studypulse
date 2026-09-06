import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";

const AuthContext = createContext(null);

async function ensureUserDoc(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email,
      plan: "free",
      createdAt: serverTimestamp(),
    });
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = loading, null = signed out
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Flip `user` as soon as Firebase confirms the session, before the
        // Firestore round trip below - route guards key off this, and a
        // slow or failing profile fetch shouldn't block the redirect.
        setUser(firebaseUser);
        setProfileError(null);
        try {
          await ensureUserDoc(firebaseUser);
          const snap = await getDoc(doc(db, "users", firebaseUser.uid));
          setProfile(snap.exists() ? snap.data() : null);
        } catch (err) {
          // Surfaced via `profileError` (see PageLayout) rather than just
          // logged - a permission-denied here means every write in the app
          // is silently failing, and that's not something to hide in the
          // console only.
          console.error("Failed to load user profile", err);
          setProfile(null);
          setProfileError(err.message || String(err));
        }
      } else {
        setUser(null);
        setProfile(null);
        setProfileError(null);
      }
    });
  }, []);

  const value = {
    user,
    profile,
    profileError,
    loading: user === undefined,
    signUp: (email, password) => createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
    signInWithGoogle: () => signInWithPopup(auth, googleProvider),
    logOut: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
