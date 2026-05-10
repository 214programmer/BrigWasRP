import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/errorHandling';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: 'citizen' | 'deputy' | 'leader' | 'admin_1' | 'admin_2' | 'admin_3' | 'deputy_superadmin' | 'superadmin';
  factionId?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        let docSnap;
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          docSnap = await getDoc(userRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            // Автоматическая выдача прав супер-админа для владельца
            if (currentUser.email === 'prudnikovdanja@gmail.com' && data.role !== 'superadmin') {
              await setDoc(userRef, { role: 'superadmin' }, { merge: true }).catch(err => {
                handleFirestoreError(err, OperationType.UPDATE, 'users/' + currentUser.uid);
              });
              data.role = 'superadmin';
            }
            setProfile({ id: docSnap.id, ...data });
          } else {
            // Auto register as citizen on first login
            const rawUsername = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
            const newProfile: Omit<UserProfile, 'id'> = {
              email: currentUser.email || '',
              username: rawUsername.substring(0, 40),
              role: currentUser.email === 'prudnikovdanja@gmail.com' ? 'superadmin' : 'citizen',
            };
            await setDoc(userRef, newProfile).catch(err => {
               handleFirestoreError(err, OperationType.CREATE, 'users/' + currentUser.uid);
            });
            setProfile({ id: currentUser.uid, ...newProfile });
          }
          setLoading(false);
        } catch (error: any) {
          setLoading(false);
          if (error.message && error.message.includes('{"error"')) {
            throw error; // Already handled by inner catch
          }
          handleFirestoreError(error, OperationType.GET, 'users/' + currentUser.uid);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    }, (error) => {
      console.error("Auth error", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
