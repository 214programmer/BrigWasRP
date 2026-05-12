import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, store } from '../lib/store';
export type { UserProfile };

// Hardcoded users to be placed here as requested: "вход был по паролю. И он будет сохраняться прям в коде и все?"
const MASTER_PASSWORD = "123";

interface AuthContextType {
  user: any | null;
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
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedId = localStorage.getItem('brigwas_user_id');
      if (savedId) {
        setUser({ uid: savedId, email: savedId + '@example.com' });
        const p = await store.getUser(savedId);
        if (p) setProfile(p);
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    const users = await store.getUsers();
    let u = users.find(u => u.email === email);
    
    if (!u) {
      throw new Error("Пользователь не найден.");
    }
    
    // Fallback block if old users don't have password, allow login, or check password.
    // Also keeping your "123" master password for easy testing.
    if (u.password && u.password !== pass && pass !== "123") {
      throw new Error("Неверный пароль.");
    }

    if (u.role !== 'superadmin' && (email === 'prudnikovdanja@gmail.com' || email === 'ivanprudnikov363@gmail.com')) {
       u.role = 'superadmin';
       await store.saveUser(u);
    }

    localStorage.setItem('brigwas_user_id', u.id);
    setUser({ uid: u.id, email: u.email });
    setProfile(u);
  };

  const registerWithEmail = async (email: string, pass: string, username: string) => {
    const users = await store.getUsers();
    const exists = users.find(u => u.email === email);
    if (exists) throw new Error("Пользователь с таким email уже есть.");

    const role = (email === 'prudnikovdanja@gmail.com' || email === 'ivanprudnikov363@gmail.com') ? 'superadmin' : 'citizen';

    const u: UserProfile = {
      id: Date.now().toString(),
      email,
      password: pass,
      username,
      role
    };
    await store.saveUser(u);
    localStorage.setItem('brigwas_user_id', u.id);
    setUser({ uid: u.id, email: u.email });
    setProfile(u);
  };

  const logout = async () => {
    localStorage.removeItem('brigwas_user_id');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
