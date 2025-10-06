import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Map, Cpu, Globe, CheckCircle, ArrowRight, Star, Lightbulb, Target } from "lucide-react";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Link } from "wouter";

export default function DreamingSessions() {
  const { userSubscription } = useSubscription();
  const isCrmProUser = userSubscription?.currentPlanType === 'crm_pro' || userSubscription?.currentPlanType === 'build_pro_bundle';

  useEffect(() => {
    document.title = "Dreaming Sessions - Terralux Agency | Earth Care Network";
    window.scrollTo(0, 0);
  }, []);

  return (
    <>

      <div className="min-h-screen bg-background">
        
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE0YzMuMzE0IDAgNiAyLjY4NiA2IDZzLTIuNjg2IDYtNiA2LTYtMi42ODYtNi02IDIuNjg2LTYgNi02ek0yNCA0NGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
          
          <div className="relative max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <Badge className="bg-white/20 text-white border-white/30 mb-6 px-4 py-2" data-testid="badge-crm-pro-exclusive">
              <Sparkles className="w-4 h-4 mr-2" />
              Exclusive for CRM Pro Members
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 font-lato" data-testid="heading-main">
              Dreaming Sessions with Terralux Agency
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto" data-testid="text-subtitle">
              Transform your enterprise with spatial network storytelling technology
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg"
                className="bg-white text-purple-700 hover:bg-white/90 px-8 py-6 text-lg font-semibold shadow-xl"
                onClick={() => window.location.href = "/apply-dreaming"}
                data-testid="button-apply-now"
              >
                <Lightbulb className="w-5 h-5 mr-2" />
                Apply for a Dreaming Session
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              {!isCrmProUser && (
                <Link href="/pricing">
                  <Button 
                    size="lg"
                    variant="outline"
                    className="bg-transparent border-2 border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
                    data-testid="button-upgrade-crm"
                  >
                    <Star className="w-5 h-5 mr-2" />
                    Upgrade to CRM Pro
                  </Button>
                </Link>
              )}
            </div>

            {!isCrmProUser && (
              <p className="text-sm text-white/70" data-testid="text-upgrade-notice">
                CRM Pro membership required • $42/month
              </p>
            )}
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground font-lato" data-testid="heading-whats-included">
                What's Included in Your Dreaming Session
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                A comprehensive transformation package designed to elevate your enterprise presence on the spatial network
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Story on the Map */}
              <Card className="border-2 hover:border-purple-500/50 transition-all duration-300" data-testid="feature-story-map">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center mb-4">
                    <Map className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-lato">Story on the Spatial Network Map</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Get your enterprise story beautifully mapped and integrated into the global spatial network, making your regenerative impact visible and discoverable.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Geographic visualization of your enterprise</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Interactive storytelling elements</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-purple-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Network connection mapping</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Digital Twin Tools */}
              <Card className="border-2 hover:border-blue-500/50 transition-all duration-300" data-testid="feature-digital-twin">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                    <Cpu className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-lato">Digital Twin Tools</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Advanced enterprise visualization tools that create a digital representation of your business for better planning and presentation.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>3D enterprise visualization</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Real-time data integration</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Impact metrics dashboard</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* AI-Powered Sales Pages */}
              <Card className="border-2 hover:border-indigo-500/50 transition-all duration-300" data-testid="feature-ai-landing">
                <CardHeader>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-4">
                    <Globe className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-lato">AI-Powered Sales Landing Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Custom-built, conversion-optimized landing pages powered by AI to effectively communicate your value proposition.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>AI-generated compelling copy</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Professional design templates</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Lead capture integration</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Additional Benefits Section */}
        <section className="py-16 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground font-lato" data-testid="heading-benefits">
                Strategic Value & Additional Benefits
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Strategic Storytelling Consultation</h3>
                      <p className="text-sm text-muted-foreground">
                        One-on-one session with our storytelling experts to craft your unique narrative and value proposition
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Earth Care Network Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Seamless integration with the Earth Care Network directory for maximum visibility and connection opportunities
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">AI Enhancement Package</h3>
                      <p className="text-sm text-muted-foreground">
                        Leverage cutting-edge AI tools to optimize your content, SEO, and marketing messaging
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Premium Support & Updates</h3>
                      <p className="text-sm text-muted-foreground">
                        Ongoing support and regular updates to keep your spatial presence fresh and engaging
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing & Value Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground font-lato" data-testid="heading-investment">
                Investment & Value
              </h2>
              <p className="text-xl text-muted-foreground">
                An exclusive benefit included with your CRM Pro membership
              </p>
            </div>

            <Card className="border-2 border-purple-500/50 bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30">
              <CardContent className="p-8 md:p-12">
                <div className="text-center mb-8">
                  <Badge className="bg-purple-600 text-white mb-4 px-4 py-2" data-testid="badge-member-exclusive">
                    <Star className="w-4 h-4 mr-2" />
                    CRM Pro Member Exclusive
                  </Badge>
                  
                  <div className="mb-6">
                    <div className="text-5xl md:text-6xl font-bold text-foreground mb-2">
                      Included
                    </div>
                    <div className="text-xl text-muted-foreground">
                      with your CRM Pro membership
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-6 max-w-md mx-auto">
                    <div className="text-sm text-muted-foreground mb-2">Regular Value</div>
                    <div className="text-3xl font-bold text-muted-foreground line-through mb-2">$2,500</div>
                    <div className="text-sm text-purple-600 font-semibold">
                      Free for CRM Pro members ($42/month)
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Transform your enterprise presence with a comprehensive package that typically costs $2,500+ — included as an exclusive benefit for all CRM Pro members.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-xl"
                      onClick={() => window.location.href = "/apply-dreaming"}
                      data-testid="button-apply-dreaming"
                    >
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Apply for Dreaming Session
                    </Button>

                    {!isCrmProUser && (
                      <Link href="/pricing">
                        <Button 
                          size="lg"
                          variant="outline"
                          className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20 px-8 py-6 text-lg"
                          data-testid="button-get-crm-pro"
                        >
                          Get CRM Pro Access
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground font-lato" data-testid="heading-process">
                How It Works
              </h2>
              <p className="text-xl text-muted-foreground">
                A simple, collaborative process from application to launch
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: "1", title: "Apply", description: "Submit your application and tell us about your enterprise" },
                { step: "2", title: "Discovery Call", description: "30-minute consultation to understand your vision and goals" },
                { step: "3", title: "Creation", description: "Our team builds your spatial story, digital twin, and landing pages" },
                { step: "4", title: "Launch", description: "Go live on the spatial network and start attracting opportunities" }
              ].map((item, index) => (
                <div key={index} className="text-center" data-testid={`step-${item.step}`}>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 text-white">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <Sparkles className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4 font-lato" data-testid="heading-final-cta">
              Ready to Transform Your Enterprise?
            </h2>
            <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
              Join the spatial network revolution and tell your story in a way that inspires action and creates lasting impact.
            </p>
            
            <Button 
              size="lg"
              className="bg-white text-purple-700 hover:bg-white/90 px-8 py-6 text-lg font-semibold shadow-xl"
              onClick={() => window.location.href = "/apply-dreaming"}
              data-testid="button-apply-final"
            >
              <Lightbulb className="w-5 h-5 mr-2" />
              Start Your Dreaming Session
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>

            <p className="mt-6 text-sm text-white/70">
              Questions? Contact us at{" "}
              <a 
                href="mailto:dreaming@terra-lux.org" 
                className="underline hover:text-white"
                data-testid="link-contact-email"
              >
                dreaming@terra-lux.org
              </a>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
