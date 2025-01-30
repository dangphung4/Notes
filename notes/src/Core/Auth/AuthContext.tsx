import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db as firestore } from './firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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

/**
 *
 * @param root0
 * @param root0.children
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    return localStorage.getItem('guestMode') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      try {
        if (user) {
          const userRef = doc(firestore, 'users', user.uid);
          
          const userData = {
            userId: user.uid,
            email: user.email?.toLowerCase() || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            lastLoginAt: new Date(),
            // Only include these fields on first creation
            ...(!user.metadata.lastSignInTime && {
              createdAt: new Date(),
              updatedAt: new Date()
            })
          };

          // Create/update user document
          await setDoc(userRef, userData, { 
            merge: true,
            mergeFields: ['userId', 'email', 'displayName', 'photoURL', 'lastLoginAt']
          });
          
          setIsGuest(false);
          localStorage.removeItem('guestMode');
        }
        setUser(user);
      } catch (error) {
        console.error('Error updating user document:', error);
        // Still set the user even if Firestore update fails
        setUser(user);
      } finally {
        setLoading(false);
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