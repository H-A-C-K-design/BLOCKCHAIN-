"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseClientConfigured } from "@/lib/firebase/client";
import { UserRole } from "@/lib/types/certificate";

interface AuthContextType {
  user: User | null;
  role: UserRole;
  institutionId?: string;
  institutionName?: string;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "none",
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("none");
  const [institutionId, setInstitutionId] = useState<string | undefined>();
  const [institutionName, setInstitutionName] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseClientConfigured();

  const fetchUserRole = async (currentUser: User) => {
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch("/api/auth/session", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRole(data.user?.role || "none");
        setInstitutionId(data.user?.institutionId);
        setInstitutionName(data.user?.institutionName);
      } else {
        setRole("none");
      }
    } catch (err) {
      console.error("Failed to fetch session role:", err);
      setRole("none");
    }
  };

  useEffect(() => {
    if (!isConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchUserRole(currentUser);
      } else {
        setRole("none");
        setInstitutionId(undefined);
        setInstitutionName(undefined);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isConfigured]);

  const signInWithGoogle = async () => {
    if (!isConfigured || !auth || !googleProvider) {
      throw new Error(
        "Firebase is not configured. Please supply NEXT_PUBLIC_FIREBASE_* environment variables."
      );
    }
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await fetchUserRole(result.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    setUser(null);
    setRole("none");
    setInstitutionId(undefined);
    setInstitutionName(undefined);
  };

  const refreshRole = async () => {
    if (user) {
      await fetchUserRole(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        institutionId,
        institutionName,
        loading,
        isConfigured,
        signInWithGoogle,
        signOut,
        refreshRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
