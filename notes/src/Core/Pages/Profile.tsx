import { useState, useEffect } from "react";
import { useAuth } from "../Auth/AuthContext";
import { updateProfile, updateEmail, updatePassword } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  PersonIcon, 
  GearIcon, 
  BellIcon, 
  LockClosedIcon,
  CheckIcon,
  ExitIcon,
} from "@radix-ui/react-icons";
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { useTheme } from "../Theme/ThemeProvider";
import { themes, ThemeName } from "../Theme/themes";
import { Check, PaletteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Profile page
 * 
 * @returns {JSX.Element}
 */
export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");
  // Security Settings
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);

  // App Settings

  const FONT_OPTIONS = [
    // Monospace fonts
    { value: 'Monaspace Neon', label: 'Monaspace Neon', class: 'font-monaspace', category: 'Monospace' },
    { value: 'JetBrains Mono', label: 'JetBrains Mono', class: 'font-jetbrains', category: 'Monospace' },
    { value: 'Fira Code', label: 'Fira Code', class: 'font-fira-code', category: 'Monospace' },
    { value: 'Ubuntu Mono', label: 'Ubuntu Mono', class: 'font-ubuntu-mono', category: 'Monospace' },
    { value: 'Inconsolata', label: 'Inconsolata', class: 'font-inconsolata', category: 'Monospace' },
    { value: 'DM Mono', label: 'DM Mono', class: 'font-dm-mono', category: 'Monospace' },
    { value: 'Space Mono', label: 'Space Mono', class: 'font-space-mono', category: 'Monospace' },
    
    // Sans Serif fonts
    { value: 'Inter', label: 'Inter', class: 'font-inter', category: 'Sans Serif' },
    { value: 'Roboto', label: 'Roboto', class: 'font-roboto', category: 'Sans Serif' },
    { value: 'Open Sans', label: 'Open Sans', class: 'font-open-sans', category: 'Sans Serif' },
    { value: 'Source Sans 3', label: 'Source Sans', class: 'font-source-sans', category: 'Sans Serif' },
    
    // Serif fonts
    { value: 'Merriweather', label: 'Merriweather', class: 'font-merriweather', category: 'Serif' },
    { value: 'Playfair Display', label: 'Playfair Display', class: 'font-playfair', category: 'Serif' },
    
    // Handwriting fonts
    { value: 'Handlee', label: 'Handlee', class: 'font-handlee', category: 'Handwriting' },
    { value: 'Patrick Hand', label: 'Patrick Hand', class: 'font-patrick-hand', category: 'Handwriting' },
    { value: 'Kalam', label: 'Kalam', class: 'font-kalam', category: 'Handwriting' },
    { value: 'Indie Flower', label: 'Indie Flower', class: 'font-indie-flower', category: 'Handwriting' },
    { value: 'Caveat', label: 'Caveat', class: 'font-caveat', category: 'Handwriting' },
    { value: 'Dancing Script', label: 'Dancing Script', class: 'font-dancing', category: 'Handwriting' },
    { value: 'Comic Neue', label: 'Comic Neue', class: 'font-comic-neue', category: 'Handwriting' }
  ];

  const { editorFont, setEditorFont } = useTheme();

  const handleFontChange = async (newFont: string) => {
    setEditorFont(newFont);
  };

  useEffect(() => {
    const loadFontPreference = () => {
      const savedFont = localStorage.getItem('editor-font');
      if (savedFont) {
        setEditorFont(savedFont);
        document.documentElement.style.setProperty('--editor-font', savedFont);
      }
    };
    
    loadFontPreference();
  }, []);

  // Add this near your other useEffects
  useEffect(() => {
    // Test font loading
    const testFontLoading = async () => {
      try {
        await document.fonts.ready;
        const fonts = document.fonts;
        console.log('Loaded fonts:', Array.from(fonts).map(f => f.family));
      } catch (error) {
        console.error('Font loading error:', error);
      }
    };
    
    testFontLoading();
  }, []);

  const updateProfileInfo = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Update display name and photo URL
      await updateProfile(user, {
        displayName,
        photoURL,
      });

      if (newEmail !== user.email) {
        await updateEmail(user, newEmail);
      }

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePasswordHandler = async () => {
    if (!user) return;
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await updatePassword(user, newPassword);
      
      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  const { theme: currentMode, setTheme: setMode, currentTheme, setCurrentTheme } = useTheme();

  // TODO add more themes and update groupings
  const groupThemes = () => {
    const groups = {
      'Default': ['default'],
      'Modern': ['materialDesign', 'tokyoNight', 'catppuccin', 'rosePine', 'discord'],
      'Classic': ['solarized', 'gruvbox', 'oneDark', 'monokaiPro'],
      'Vibrant': ['synthwave', 'cyberpunk', 'shadesOfPurple'],
      'Natural': ['horizon', 'palenight', 'ayu', 'tuscanWallAmpala', 'vesper'],
      'Professional': ['github', 'nord', 'cobalt', 'winterIsComing'],
    };
    
    return Object.entries(groups).map(([groupName, themeNames]) => ({
      name: groupName,
      themes: themeNames.map(name => ({
        name: name as ThemeName,
        displayName: name === 'default' ? 'Default' : name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')
      }))
    }));
  };

  // Add this helper function near the top of the component
  const getEffectiveTheme = (mode: 'light' | 'dark' | 'system') => {
    if (mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  };

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      
      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="w-full flex flex-wrap gap-2 h-auto">
          <TabsTrigger value="profile" className="flex-1 min-w-[120px] items-center gap-2">
            <PersonIcon /> Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 min-w-[120px] items-center gap-2">
            <LockClosedIcon /> Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 min-w-[120px] items-center gap-2">
            <BellIcon /> Notifications
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex-1 min-w-[120px] items-center gap-2">
            <GearIcon /> Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your profile information and email address
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={photoURL ?? user?.photoURL} alt={displayName || user?.email || 'Profile'} />
                  <AvatarFallback className="text-lg">{getInitials()}</AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground text-center">
                  {photoURL ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1 justify-center">
                      <CheckIcon className="h-4 w-4" />
                      Image loaded successfully
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      No profile picture set
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="max-w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="max-w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="photoURL">Profile Picture URL</Label>
                <Input
                  id="photoURL"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="max-w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Enter a URL for your profile picture. The image should be square for best results.
                </p>
              </div>

              <Button 
                onClick={updateProfileInfo} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Updating...
                  </span>
                ) : (
                  "Update Profile"
                )}
              </Button>

              <Button 
                variant="destructive"
                onClick={() => navigate('/logout')}
                className="w-full mt-4"
              >
                <ExitIcon className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Update your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button 
                onClick={updatePasswordHandler} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about your notes via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show desktop notifications when changes occur
                  </p>
                </div>
                <Switch
                  checked={desktopNotifications}
                  onCheckedChange={setDesktopNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>App Preferences</CardTitle>
              <CardDescription>
                Customize your note-taking experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <Label>App Font</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred font for the app
                  </p>
                </div>
                <Select
                  value={editorFont}
                  onValueChange={handleFontChange}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select font" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      FONT_OPTIONS.reduce((acc, font) => {
                        if (!acc[font.category]) acc[font.category] = [];
                        acc[font.category].push(font);
                        return acc;
                      }, {} as Record<string, typeof FONT_OPTIONS>)
                    ).map(([category, fonts]) => (
                      <SelectGroup key={category}>
                        <SelectLabel className="px-2 py-1.5 text-sm font-semibold">{category}</SelectLabel>
                        {fonts.map(font => (
                          <SelectItem 
                            key={font.value} 
                            value={font.value}
                            className={font.class}
                          >
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <PaletteIcon className="h-8 w-8 text-primary" />
                  <h3 className="text-2xl font-semibold">Theme</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mode</CardTitle>
                      <CardDescription>Choose your preferred color mode</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <Button
                        variant={currentMode === 'light' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setMode('light')}
                      >
                        <div className="flex items-center gap-2">
                          {currentMode === 'light' && <Check className="h-4 w-4" />}
                          Light
                        </div>
                      </Button>
                      <Button
                        variant={currentMode === 'dark' ? 'default' : 'outline'}
                        className="w-full justify-start"
                        onClick={() => setMode('dark')}
                      >
                        <div className="flex items-center gap-2">
                          {currentMode === 'dark' && <Check className="h-4 w-4" />}
                          Dark
                        </div>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Theme Presets</CardTitle>
                      <CardDescription>Select a predefined color theme</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                          {groupThemes().map((group) => (
                            <div key={group.name} className="space-y-2">
                              <h4 className="text-sm font-medium text-muted-foreground">{group.name}</h4>
                              {group.themes.map((theme) => (
                                <Button
                                  key={theme.name}
                                  variant="outline"
                                  className={cn(
                                    "w-full justify-start gap-2",
                                    currentTheme === theme.name && "border-primary"
                                  )}
                                  onClick={() => setCurrentTheme(theme.name)}
                                >
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="flex gap-1">
                                      <div
                                        className="h-4 w-4 rounded-full"
                                        style={{
                                          backgroundColor: `hsl(${themes[theme.name][getEffectiveTheme(currentMode)].primary})`,
                                        }}
                                      />
                                      <div
                                        className="h-4 w-4 rounded-full"
                                        style={{
                                          backgroundColor: `hsl(${themes[theme.name][getEffectiveTheme(currentMode)].secondary})`,
                                        }}
                                      />
                                    </div>
                                    <span>{theme.displayName}</span>
                                    {currentTheme === theme.name && (
                                      <Check className="h-4 w-4 ml-auto" />
                                    )}
                                  </div>
                                </Button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Theme Preview</CardTitle>
                  <CardDescription>
                    See how your selected theme looks with different components
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="grid gap-2">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Buttons</h4>
                      <div className="flex flex-wrap gap-2">
                        <Button>Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="destructive">Destructive</Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Cards</h4>
                      <div className="grid gap-2">
                        <Card>
                          <CardHeader>
                            <CardTitle>Example Card</CardTitle>
                            <CardDescription>
                              This is how cards will look with this theme
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">
                              Card content with muted text
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Form Elements</h4>
                      <div className="grid gap-2">
                        <Input placeholder="Input field" />
                        <div className="flex items-center space-x-2">
                          <Switch id="example-switch" />
                          <Label htmlFor="example-switch">Switch</Label>
                        </div>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="option1">Option 1</SelectItem>
                            <SelectItem value="option2">Option 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Alerts and Messages</h4>
                      <div className="grid gap-2">
                        <div className="p-3 bg-primary/10 text-primary rounded-md">
                          Primary Alert
                        </div>
                        <div className="p-3 bg-secondary/10 text-secondary rounded-md">
                          Secondary Alert
                        </div>
                        <div className="p-3 bg-destructive/10 text-destructive rounded-md">
                          Destructive Alert
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
