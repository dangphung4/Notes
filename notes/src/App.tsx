import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import { DesktopNav, MobileNav } from "./Core/Components/navbar";
import Auth from "./Core/Auth/Auth.tsx";
import Home from "./Core/Pages/Home.tsx";
import PWABadge from "./PWABadge.tsx";
import { auth } from "./Core/Auth/firebase.ts";
import { useAuth } from "./Core/Auth/AuthContext.tsx";
import Signup from "./Core/Auth/Signup";
import Footer from "./Core/Components/footer";
import Profile from "./Core/Pages/Profile";
import Layout from "./Core/Components/layout";
import Notes from './Core/Pages/Notes';
import NewNote from './Core/Pages/NewNote';
import EditNote from './Core/Pages/EditNote';
import Install from './Core/Pages/Install';
import Calendar from './Core/Pages/Calendar';
import { Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "./Core/Components/ui/command";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme !== null) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
    
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  function PrivateRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/auth" />;

    return <>{children}</>;
  }
  
  const [open, setOpen] = useState(false);

  // add commands to navigate to pages, and pages will show depending if you are authenticated
  const commands = [
  ]

  return (
    <BrowserRouter>
      <div className={darkMode ? "dark" : ""}>
        <div className="min-h-screen flex flex-col bg-background text-foreground">
          <DesktopNav
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
          />
          <MobileNav
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
          />
          <Layout>
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                  path="/notes"
                  element={
                    <PrivateRoute>
                      <Notes />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/notes/new"
                  element={
                    <PrivateRoute>
                      <NewNote />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <PrivateRoute>
                      <Calendar />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/notes/:id"
                  element={
                    <PrivateRoute>
                      <EditNote />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route path="/logout" element={<LogoutHandler />} />
                <Route path="/install" element={<Install />} />
              </Routes>
            </main>
          </Layout>
          <Footer />
          <PWABadge />
        </div>
      </div>
    </BrowserRouter>
  );
}

function LogoutHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    auth.signOut().then(() => {
      navigate("/");
    });
  }, [navigate]);

  return <div>Logging out...</div>;
}

export default App;
