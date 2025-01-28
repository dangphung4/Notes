import { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase';
import { User, onAuthStateChanged } from 'firebase/auth';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isGuest: false,
  enableGuestMode: () => {},
  disableGuestMode: () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('guestMode') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      // Disable guest mode when user logs in
      if (user) {
        setIsGuest(false);
        localStorage.removeItem('guestMode');
      }
    });

    return () => unsubscribe();
  }, []);

  const enableGuestMode = () => {
    setIsGuest(true);
    localStorage.setItem('guestMode', 'true');
  };

  const disableGuestMode = () => {
    setIsGuest(false);
    localStorage.removeItem('guestMode');
  };

  return (
    <AuthContext.Provider value={{ user, loading, isGuest, enableGuestMode, disableGuestMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);