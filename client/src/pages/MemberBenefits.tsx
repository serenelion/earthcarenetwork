import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Gift, Star, Shield, Network, Zap, CheckCircle, Users, Building, Heart, ArrowRight, ExternalLink } from "lucide-react";
import Navigation from "@/components/Navigation";

export default function MemberBenefits() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section - Emphasizing Free & Open Source */}
      <section className="hero-gradient earth-pattern text-white py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Badge className="bg-white/20 text-white border-white/30 mb-6" data-testid="badge-free-open-source">
            <Zap className="w-4 h-4 mr-2" />
            Free & Open Source Forever
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 font-lato">
            Unlock the Power of Earth Network
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90">
            Join our regenerative community and access exclusive tools, networks, and opportunities—completely free.
          </p>
          
          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              className="bg-secondary hover:bg-secondary/90 text-white px-8 py-3 text-lg font-semibold"
              data-testid="button-become-partner-hero"
              onClick={() => window.location.href = "/partner-application"}
            >
              <Star className="w-5 h-5 mr-2" />
              Apply for Partnership
            </Button>
            <Button 
              variant="outline" 
              className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white/30 px-8 py-3 text-lg"
              data-testid="button-join-member-hero"
              onClick={() => window.location.href = "/api/login"}
            >
              <Users className="w-5 h-5 mr-2" />
              Join as Member
            </Button>
          </div>
          
          <p className="mt-6 text-white/70 text-sm">
            Free forever • Instant access • No credit card required
          </p>
        </div>
      </section>

      {/* What Members Get - Benefits Overview */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-lato">What Members Get</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join thousands of regenerative leaders accessing our comprehensive platform for discovering, reviewing, and connecting with earth-positive enterprises.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Enterprise Discovery & Search */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300" data-testid="benefit-enterprise-discovery">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Building className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-lato">Enterprise Discovery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access our comprehensive directory of 1000+ regenerative enterprises across land projects, capital sources, and green technologies.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Advanced search & filtering</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Category-based browsing</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Location-based discovery</li>
                </ul>
              </CardContent>
            </Card>

            {/* Review & Claim System */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300" data-testid="benefit-review-claim">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="text-xl font-lato">Review & Claim Enterprises</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Verify enterprise information, add reviews, and claim your own enterprise profile to build credibility in the community.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Submit detailed reviews</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Claim & manage profiles</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Verification badges</li>
                </ul>
              </CardContent>
            </Card>

            {/* Favorites System */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300" data-testid="benefit-favorites">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl font-lato">Personal Favorites</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Save and organize your preferred enterprises, track their updates, and build your personalized regenerative network.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Unlimited saved favorites</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Custom categories</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Update notifications</li>
                </ul>
              </CardContent>
            </Card>

            {/* Partner Network Access */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300" data-testid="benefit-partner-network">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Network className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-lato">Exclusive Partner Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Connect with verified partners and access exclusive opportunities, discounts, and collaborative projects.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Partner-only events</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Collaboration opportunities</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Direct messaging</li>
                </ul>
              </CardContent>
            </Card>

            {/* Exclusive Discounts */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300" data-testid="benefit-discounts">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6 text-secondary" />
                </div>
                <CardTitle className="text-xl font-lato">Member Discounts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access special pricing and exclusive offers from our partner network of regenerative service providers.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Up to 30% partner discounts</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Early access to offers</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Exclusive member rates</li>
                </ul>
              </CardContent>
            </Card>

            {/* Open Source Contribution */}
            <Card className="border-2 hover:border-primary/50 transition-all duration-300" data-testid="benefit-open-source">
              <CardHeader>
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-xl font-lato">Open Source Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Contribute to and benefit from our open-source ecosystem of regenerative tools and datasets.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />API access</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Data exports</li>
                  <li className="flex items-center"><CheckCircle className="w-4 h-4 text-primary mr-2" />Community contributions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Special Offer - Spatial Network Build Pro */}
      <section className="py-16 bg-muted">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20" data-testid="spatial-network-offer">
            <CardContent className="p-8 text-center">
              <Badge className="bg-secondary text-white mb-4" data-testid="badge-exclusive-offer">
                Exclusive Member Offer
              </Badge>
              <h3 className="text-2xl font-bold mb-4 font-lato">Spatial Network Build Pro</h3>
              <p className="text-muted-foreground mb-6">
                Power up your regenerative mapping projects with our partner's premium platform.
              </p>
              
              <div className="flex justify-center items-center space-x-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-muted-foreground line-through">$99</div>
                  <div className="text-sm text-muted-foreground">Regular Price</div>
                </div>
                <ArrowRight className="w-6 h-6 text-primary" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary">$88.11</div>
                  <div className="text-sm text-secondary font-semibold">11% Member Discount</div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Build sophisticated geospatial applications for tracking regenerative impact, visualizing land use changes, and connecting with other earth stewards.
              </p>

              <Button 
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3"
                data-testid="button-claim-spatial-discount"
                onClick={() => window.open("https://thespatialnetwork.net", "_blank")}
              >
                Claim Your Discount <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Social Proof & Community */}
      <section className="py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-foreground font-lato">Join the Regenerative Movement</h2>
            <p className="text-xl text-muted-foreground">
              Trusted by earth stewards, regenerative entrepreneurs, and impact investors worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center" data-testid="stat-enterprises">
              <div className="text-4xl font-bold text-primary mb-2">1,000+</div>
              <div className="text-muted-foreground">Regenerative Enterprises</div>
            </div>
            <div className="text-center" data-testid="stat-members">
              <div className="text-4xl font-bold text-secondary mb-2">5,000+</div>
              <div className="text-muted-foreground">Active Members</div>
            </div>
            <div className="text-center" data-testid="stat-partnerships">
              <div className="text-4xl font-bold text-accent mb-2">250+</div>
              <div className="text-muted-foreground">Partnership Connections</div>
            </div>
          </div>

          <div className="bg-muted p-8 rounded-lg text-center">
            <blockquote className="text-lg italic text-muted-foreground mb-4">
              "Earth Network has become our go-to platform for discovering regenerative partners and validating our impact investments. The community-driven approach ensures we're connecting with authentic, mission-driven enterprises."
            </blockquote>
            <div className="font-semibold text-foreground">— Sarah Chen, Impact Investment Director</div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-4 font-lato">Ready to Make an Impact?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Join our growing community of regenerative leaders. Start exploring, connecting, and collaborating today—completely free.
          </p>
          
          {/* Membership Path Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Partner Path */}
            <Card className="bg-secondary text-white border-secondary">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 mx-auto mb-3" />
                <h3 className="text-xl font-bold mb-3">Become a Partner</h3>
                <p className="text-white/90 mb-4 text-sm">
                  Ready to lead? Get featured placement, advanced networking, and partnership opportunities.
                </p>
                <Button 
                  className="bg-white text-secondary hover:bg-gray-100 w-full"
                  data-testid="button-become-partner-final"
                  onClick={() => window.location.href = "/partner-application"}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Apply for Partnership
                </Button>
                <p className="text-xs text-white/70 mt-2">Limited partnerships available</p>
              </CardContent>
            </Card>

            {/* Member Path */}
            <Card className="bg-white text-foreground border-2 border-primary">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 mx-auto mb-3 text-primary" />
                <h3 className="text-xl font-bold mb-3">Join as Member</h3>
                <p className="text-muted-foreground mb-4 text-sm">
                  Perfect starting point. Access our full directory, save favorites, and join the community.
                </p>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
                  data-testid="button-join-member-final"
                  onClick={() => window.location.href = "/api/login"}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Join as Member
                </Button>
                <p className="text-xs text-muted-foreground mt-2">Free forever • No credit card</p>
              </CardContent>
            </Card>
          </div>

          <p className="text-sm text-primary-foreground/70">
            Powered by <a 
              href="https://terra-lux.org/terraluxtech/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-primary-foreground"
              data-testid="link-terralux-powered"
            >
              TerraLux Technology
            </a> • Partner with <a
              href="https://thespatialnetwork.net"
              target="_blank"
              rel="noopener noreferrer" 
              className="underline hover:text-primary-foreground"
              data-testid="link-spatial-network"
            >
              The Spatial Network
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}