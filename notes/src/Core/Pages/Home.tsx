import { Button } from "../../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../components/ui/card";
import { useAuth } from "../Auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  MoonIcon, 
  LightningBoltIcon,
  MixIcon,
  CodeIcon,
  DrawingPinIcon,
  ClockIcon,
  RocketIcon,
  UpdateIcon,
  GitHubLogoIcon,
  VercelLogoIcon,
  EnterIcon
} from "@radix-ui/react-icons";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="flex justify-center mb-6">
          <RocketIcon className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Notes, Reimagined
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          A minimalist note-taking app built with modern tech. Clean, fast, and focused on what matters most - your thoughts.
        </p>
        <div className="flex justify-center gap-4">
          {user ? (
            <div className="space-y-4">
              <Button onClick={() => navigate('/notes')} size="lg" className="w-full">
                <LightningBoltIcon className="mr-2 h-5 w-5" /> Open Notes
              </Button>
              <p className="text-sm text-muted-foreground">
                Welcome back, {user.email}!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={() => navigate('/auth')} size="lg">
                  <EnterIcon className="mr-2 h-5 w-5" /> Sign In
                </Button>
                <Button onClick={() => navigate('/signup')} size="lg" variant="outline">
                  Get Started
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Free to try, no credit card required
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MixIcon className="h-6 w-6 text-primary" />
                <CardTitle>Clean Design</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Minimalist interface that helps you focus on writing. No distractions, just pure content creation.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <MoonIcon className="h-6 w-6 text-primary" />
                <CardTitle>Dark Mode</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Easy on the eyes with automatic theme switching. Perfect for late-night writing sessions.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CodeIcon className="h-6 w-6 text-primary" />
                <CardTitle>Open Source</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built with modern tech and available on GitHub. Feel free to contribute or fork the project.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      {!user && (
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="bg-primary/10 rounded-lg p-8 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Join thousands of users who have already transformed their note-taking experience.
            </p>
            <Button onClick={() => navigate('/signup')} size="lg">
              Create Free Account
            </Button>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-20 bg-muted/30">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-12">
          <div className="flex-1 space-y-8">
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">1</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Sign In</h3>
                <p className="text-muted-foreground">Create an account or sign in to access your personal note space.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">2</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Create Notes</h3>
                <p className="text-muted-foreground">Start writing with our clean, distraction-free editor.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center shrink-0">3</div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Organize</h3>
                <p className="text-muted-foreground">Keep your thoughts organized with tags and categories.</p>
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-lg overflow-hidden shadow-xl">
            <img 
              src="/screenshot.png" 
              alt="App Screenshot" 
              className="w-full h-auto"
              onError={(e) => {
                e.currentTarget.src = 'https://placehold.co/600x400?text=App+Screenshot';
              }}
            />
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="container mx-auto px-4 py-20">
          <h3 className="text-2xl font-bold text-center mb-8">Additional Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <DrawingPinIcon className="h-6 w-6 text-primary" />
                <CardTitle>Quick Notes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Capture your thoughts instantly with our streamlined interface. No complicated menus or setups required.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-6 w-6 text-primary" />
                <CardTitle>Cloud Sync</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Your notes are automatically saved and synced across all your devices. Never lose your thoughts again.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <UpdateIcon className="h-6 w-6 text-primary" />
                <CardTitle>Regular Updates</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Constantly improving with new features and refinements based on user feedback and needs.
              </CardDescription>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <LightningBoltIcon className="h-6 w-6 text-primary" />
                <CardTitle>Lightning Fast</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Built for speed and performance. Your notes load instantly, letting you focus on what matters.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Built With Modern Tech</h2>
        <div className="flex flex-wrap justify-center gap-8 items-center max-w-3xl mx-auto">
          <div className="text-center p-4">
            <CodeIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">React</p>
          </div>
          <div className="text-center p-4">
            <LightningBoltIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">TypeScript</p>
          </div>
          <div className="text-center p-4">
            <MixIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">Tailwind CSS</p>
          </div>
          <div className="text-center p-4">
            <VercelLogoIcon className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="font-semibold">Firebase & Vercel</p>
          </div>
        </div>
      </section>


      {/* About Section */}
      <section className="bg-background py-20">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <h2 className="text-3xl font-bold mb-6">About This Project</h2>
          <p className="text-muted-foreground mb-4">
            I built this app because I wanted a clean, simple way to organize my thoughts. 
            It's my take on what a modern note-taking app should be - no clutter, no distractions.
          </p>
          <p className="text-muted-foreground mb-6">
            Feel free to try it out and let me know what you think!
          </p>
          <Button 
            variant="outline" 
            onClick={() => window.open('https://github.com/yourusername/notes-app', '_blank')}
          >
            <GitHubLogoIcon className="mr-2 h-4 w-4" /> View on GitHub
          </Button>
        </div>
      </section>
    </div>
  );
}
