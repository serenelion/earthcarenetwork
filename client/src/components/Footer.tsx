import { Link } from "wouter";
import { Globe, FileText, Book, Users, Heart, Building2, Sprout, Coins, Wrench, Network } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              About
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/docs" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-documentation"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link 
                  href="/" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-about"
                >
                  About Earth Network
                </Link>
              </li>
              <li>
                <a 
                  href="https://thespatialnetwork.net" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-spatial-network"
                >
                  The Spatial Network
                </a>
              </li>
            </ul>
          </div>

          {/* Directory Section */}
          <div>
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Directory
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/directory/land-projects" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-land-projects"
                >
                  Land Projects
                </Link>
              </li>
              <li>
                <Link 
                  href="/directory/capital-sources" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-capital-sources"
                >
                  Capital Sources
                </Link>
              </li>
              <li>
                <Link 
                  href="/directory/open-source-tools" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-open-source-tools"
                >
                  Open Source Tools
                </Link>
              </li>
              <li>
                <Link 
                  href="/directory/network-organizers" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-network-organizers"
                >
                  Network Organizers
                </Link>
              </li>
            </ul>
          </div>

          {/* Community Section */}
          <div>
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Community
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/member-benefits" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-become-member"
                >
                  Become a Member
                </Link>
              </li>
              <li>
                <Link 
                  href="/partners" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-partners"
                >
                  Partners
                </Link>
              </li>
              <li>
                <a 
                  href="https://terra-lux.org/terraluxtech/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-become-partner"
                >
                  Become a Partner
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Book className="h-5 w-5 text-primary" />
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <Link 
                  href="/docs" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-docs"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link 
                  href="/docs/api-overview" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-api-docs"
                >
                  API Documentation
                </Link>
              </li>
              <li>
                <Link 
                  href="/pricing" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-pricing"
                >
                  Pricing Plans
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-terms"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-privacy"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="footer-link-cookies"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Globe className="h-5 w-5 text-primary" />
              <span data-testid="footer-copyright">
                © {currentYear} Earth Network. All rights reserved.
              </span>
            </div>
            <div className="text-muted-foreground text-sm" data-testid="footer-powered-by">
              Powered by{" "}
              <a 
                href="https://terra-lux.org/terraluxtech/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                data-testid="footer-link-terralux"
              >
                TerraLux Technology
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
