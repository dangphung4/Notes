import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
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
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, Command } from "@/components/ui/command";

// Separate component for command palette
function CommandPalette() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Handle keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Use location to check current path
  const location = useLocation();
  const isCalendarPage = location.pathname === "/calendar";
  
  // Debug log
  console.log('Current path:', location.pathname);
  console.log('Is Calendar Page:', isCalendarPage);

  // Filter out home from commands when on calendar page
  const publicPages = [
    {
      id: "home",
      name: "Home",
      shortcut: ["G", "H"],
      action: () => {
        navigate("/");
        setOpen(false);
      },
    },
    {
      id: "install",
      name: "Install App",
      shortcut: ["G", "I"],
      action: () => {
        navigate("/install");
        setOpen(false);
      },
    },
  ];

  const filteredPublicPages = isCalendarPage 
    ? publicPages.filter(page => page.id !== "home")
    : publicPages;

  const commands = [
    {
      heading: "Public Pages",
      items: filteredPublicPages,
    },
    {
      heading: "Authentication",
      items: user
        ? [
            {
              id: "logout",
              name: "Logout",
              shortcut: ["G", "L"],
              action: () => {
                navigate("/logout");
                setOpen(false);
              },
            },
          ]
        : [
            {
              id: "login",
              name: "Login",
              shortcut: ["G", "L"],
              action: () => {
                navigate("/auth");
                setOpen(false);
              },
            },
            {
              id: "signup",
              name: "Sign Up",
              shortcut: ["G", "S"],
              action: () => {
                navigate("/signup");
                setOpen(false);
              },
            },
          ],
    },
    ...(user
      ? [
          {
            heading: "Protected Pages",
            items: [
              {
                id: "notes",
                name: "Notes",
                shortcut: ["G", "N"],
                action: () => {
                  navigate("/notes");
                  setOpen(false);
                },
              },
              {
                id: "new-note",
                name: "New Note",
                shortcut: ["G", "M"],
                action: () => {
                  navigate("/notes/new");
                  setOpen(false);
                },
              },
              {
                id: "calendar",
                name: "Calendar",
                shortcut: ["G", "C"],
                action: () => {
                  navigate("/calendar");
                  setOpen(false);
                },
              },
              {
                id: "profile",
                name: "Profile",
                shortcut: ["G", "P"],
                action: () => {
                  navigate("/profile");
                  setOpen(false);
                },
              },
            ],
          },
        ]
      : []),
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commands.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={item.action}
                >
                  <span>{item.name}</span>
                  {item.shortcut && (
                    <div className="ml-auto flex items-center space-x-2">
                      {item.shortcut.map((key, index) => (
                        <span
                          key={index}
                          className="rounded bg-muted px-2 py-1 text-sm"
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

// Main App component
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

  // Routes configuration component
  function AppRoutes() {
    return (
      <>
        <CommandPalette />
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
      </>
    );
  }

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
          <AppRoutes />
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