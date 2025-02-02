import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/Core/Auth/AuthContext";
import {
  HamburgerMenuIcon,
  HomeIcon,
  PersonIcon,
  FileTextIcon,
  ExitIcon,
  EnterIcon,
  MoonIcon,
  SunIcon,
  GlobeIcon,
  CalendarIcon,
  ClockIcon,
} from "@radix-ui/react-icons";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "../Theme/ThemeProvider";
import { PenSquareIcon, FolderIcon } from "lucide-react";

interface NavProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

/**
 *
 * @param root0
 * @param root0.darkMode
 * @param root0.toggleDarkMode
 */
export function DesktopNav({ darkMode }: NavProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Get initials from display name or email
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || '?';
  };

  // Update document class when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <nav className="hidden md:block fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-b z-50 h-16">
      <div className="container mx-auto px-4 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/')}>
              <HomeIcon className="h-5 w-5" />
              <span className="ml-2">Home</span>
            </Button>
            {user && (
              <>
                <Button variant="ghost" onClick={() => navigate('/notes')}>
                  <FileTextIcon className="h-5 w-5" />
                  <span className="ml-2">Notes</span>
                </Button>
                <Button variant="ghost" onClick={() => navigate('/folders')}>
                  <FolderIcon className="h-5 w-5" />
                  <span className="ml-2">Folders</span>
                </Button>
                <Button variant="ghost" onClick={() => navigate('/calendar')}>
                  <CalendarIcon className="h-5 w-5" />
                  <span className="ml-2">Calendar</span>
                </Button>
                <Button variant="ghost" onClick={() => navigate('/productivity')}>
                  <ClockIcon className="h-5 w-5" />
                  <span className="ml-2">Productivity</span>
                </Button>
              </>
            )}
            {!user && (
              <Button variant="ghost" asChild>
                <Link to="/install">
                  <GlobeIcon className="h-4 w-4 mr-2" />
                  Install App
                </Link>
              </Button>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </Button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <PersonIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/notes')}>
                    <FileTextIcon className="mr-2 h-4 w-4" />
                    <span>Notes</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/folders')}>
                    <FolderIcon className="mr-2 h-4 w-4" />
                    <span>Folders</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/calendar')}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Calendar</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/productivity')}>
                    <ClockIcon className="mr-2 h-4 w-4" />
                    <span>Productivity</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/logout')}>
                    <ExitIcon className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                <EnterIcon className="h-5 w-5" />
                <span className="ml-2">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/**
 *
 * @param root0
 * @param root0.darkMode
 * @param root0.toggleDarkMode
 */
export function MobileNav({ darkMode }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  // Get initials from display name or email
  const getInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase();
    }
    return user?.email?.[0].toUpperCase() || '?';
  };

  // Update document class when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="md:hidden fixed bottom-16 right-2 flex flex-col items-end gap-2 z-50">
      {isOpen && (
        <div className="flex flex-col items-end gap-2 mb-2">
          <Button
            variant="default"
            size="icon"
            className="rounded-full shadow-lg"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </Button>
          <Button
            variant="default"
            size="icon"
            className="rounded-full shadow-lg"
            onClick={() => handleNavigation('/')}
          >
            <HomeIcon className="h-5 w-5" />
          </Button>
          {user ? (
            <>
              <Button
                variant="default"
                size="icon"
                className="rounded-full shadow-lg"
                onClick={() => handleNavigation('/notes')}
              >
                <FileTextIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="rounded-full shadow-lg"
                onClick={() => handleNavigation('/folders')}
              >
                <FolderIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="rounded-full shadow-lg"
                onClick={() => handleNavigation('/calendar')}
              >
                <CalendarIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="rounded-full shadow-lg"
                onClick={() => handleNavigation('/productivity')}
              >
                <ClockIcon className="h-5 w-5" />
              </Button>
              <Button
                variant="default"
                size="icon"
                className="rounded-full shadow-lg p-0 overflow-hidden"
                onClick={() => handleNavigation('/profile')}
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'User'} />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </>
          ) : (
            <Button
              variant="default"
              size="icon"
              className="rounded-full shadow-lg"
              onClick={() => handleNavigation('/auth')}
            >
              <EnterIcon className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
      {/* another button to quickly open a new note on mobile on top of hamburger menu */}
      { user && (
      <Button
        variant="default"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => handleNavigation('/notes/new')}
      >
          <PenSquareIcon className="h-6 w-6" />
        </Button>
      )}
      <Button
        variant="default"
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <HamburgerMenuIcon className="h-6 w-6" />
      </Button>
    </div>
  );
}
