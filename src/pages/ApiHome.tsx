import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Book, Zap, Server } from "lucide-react";

const ApiHome = () => {
  const apiVersions = [
    {
      version: "v1",
      status: "current",
      description: "Current stable API version with user endpoints",
      releaseDate: "January 2025",
      endpoints: 1,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight">
                <span className="text-gradient">LOKRO</span>
                <span className="text-foreground">GAMES API</span>
              </h1>
              <p className="text-muted-foreground mt-1">
                Access user data and game statistics programmatically
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/">Back to App</Link>
              </Button>
              <Button asChild>
                <Link to="/api/docs">
                  <Book className="w-4 h-4 mr-2" />
                  Documentation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-12">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Server className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-muted-foreground text-sm">API Version</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Zap className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">100%</p>
                  <p className="text-muted-foreground text-sm">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Book className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">1</p>
                  <p className="text-muted-foreground text-sm">Endpoints</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Versions */}
        <section>
          <h2 className="text-2xl font-bold mb-6">API Versions</h2>
          <div className="space-y-4">
            {apiVersions.map((api) => (
              <Card key={api.version} className="bg-card/50 border-border/50 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{api.version.toUpperCase()}</CardTitle>
                      <Badge 
                        variant={api.status === "current" ? "default" : "secondary"}
                        className={api.status === "current" ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                      >
                        {api.status}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/api/docs">
                        View Docs
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                  <CardDescription>{api.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 text-sm text-muted-foreground">
                    <span>Released: {api.releaseDate}</span>
                    <span>{api.endpoints} endpoint{api.endpoints !== 1 ? 's' : ''}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Base URL */}
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Base URL</h2>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <code className="block p-4 bg-muted/50 rounded-lg text-sm font-mono break-all">
                https://xheigkblbvfogcosflmv.supabase.co/functions/v1/api
              </code>
              <p className="text-muted-foreground text-sm mt-4">
                All API requests should be made to this base URL, followed by the version and endpoint path.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default ApiHome;
