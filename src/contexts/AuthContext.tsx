import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, store } from '../lib/store';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export type { UserProfile };

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let p = await store.getUser(firebaseUser.uid);
        // Fallback role assignment for admins
        if (p && p.role !== 'superadmin' && (firebaseUser.email === 'prudnikovdanja@gmail.com' || firebaseUser.email === 'ivanprudnikov363@gmail.com')) {
           p.role = 'superadmin';
           await store.saveUser(p);
        }
        setProfile(p || null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, username: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const role = (email === 'prudnikovdanja@gmail.com' || email === 'ivanprudnikov363@gmail.com') ? 'superadmin' : 'citizen';

    const u: UserProfile = {
      id: userCredential.user.uid,
      email,
      password: '', // do not store plain text password in DB
      username,
      role
    };
    await store.saveUser(u);
    setProfile(u);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

