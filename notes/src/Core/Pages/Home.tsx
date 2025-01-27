import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useState, useEffect } from "react";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  // Check system preference and local storage
  useEffect(() => {
    const isDark = localStorage.theme === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    
    // Ensure the class is properly set on initial load
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // Update the root element
    if (newMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
    
    localStorage.theme = newMode ? 'dark' : 'light';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4">
        <Button 
          variant="default" 
          size="icon" 
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Your Thoughts, Organized
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          FocusFlow is the modern note-taking app that helps you capture ideas, organize thoughts, and stay productive - all in one place.
        </p>
        <div className="flex justify-center gap-4">
          {user ? (
            <Button onClick={() => navigate('/notes')} size="lg">
              Go to Notes
            </Button>
          ) : (
            <>
              <Button onClick={() => navigate('/auth')} size="lg">
                Get Started
              </Button>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Why FocusFlow?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Offline First</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access your notes anywhere, anytime - even without internet.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Smart categorization and summarization using AI.
              </CardDescription>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cross-Platform</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sync across all your devices seamlessly.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Organized?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who are already boosting their productivity with FocusFlow.
          </p>
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <Input placeholder="Enter your email" />
              <Button>Start Free Trial</Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              No credit card required. 14-day free trial.
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-4 p-4">
        <h1 className="text-3xl font-bold text-primary">Button Variants Test</h1>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>

      <div className="text-foreground">...</div>
    </div>
  );
}
