import { GitHubLogoIcon, LinkedInLogoIcon } from "@radix-ui/react-icons";
import { Link } from "react-router-dom";
import { DownloadIcon, } from "lucide-react";
import { Button } from "@/components/ui/button";
/**
 *
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">Notes</h3>
                <Button variant="link" size="icon" asChild>
                    <Link to="/install">
                        <DownloadIcon/>
                    </Link>
                </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              A minimalist note-taking app because I don't like apple notes.
            </p>
            
          </div>

          {/* Quick Links
          <div className="space-y-3">
            <h3 className="font-semibold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-foreground transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-foreground transition-colors">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div> */}

          {/* Legal */}
          <div className="space-y-3">
            <h3 className="font-semibold">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-3">
            <h3 className="font-semibold">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/dangphung4"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <GitHubLogoIcon className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com/in/dang-phung"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <LinkedInLogoIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {currentYear} Dang Phung. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
