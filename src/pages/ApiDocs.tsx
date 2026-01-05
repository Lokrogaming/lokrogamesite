import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useState } from "react";

const ApiDocs = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(id);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const baseUrl = "https://xheigkblbvfogcosflmv.supabase.co/functions/v1/api";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/api">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              <div>
                <h1 className="font-display text-xl font-bold">API Documentation</h1>
                <p className="text-muted-foreground text-sm">Version 1.0</p>
              </div>
            </div>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">v1 - Current</Badge>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <nav className="sticky top-24 space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
                Endpoints
              </h3>
              <a href="#introduction" className="block py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                Introduction
              </a>
              <a href="#authentication" className="block py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                Authentication
              </a>
              <a href="#get-user" className="block py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="inline-block w-12 text-xs font-mono bg-green-500/20 text-green-400 rounded px-1 mr-2">GET</span>
                Get User
              </a>
              <a href="#errors" className="block py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                Error Handling
              </a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-12">
            {/* Introduction */}
            <section id="introduction">
              <h2 className="text-3xl font-bold mb-4">Introduction</h2>
              <p className="text-muted-foreground mb-6">
                Welcome to the LokroGames API documentation. This API allows you to access user data and game statistics programmatically.
              </p>
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Base URL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted/50 rounded-lg text-sm font-mono break-all">
                      {baseUrl}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(baseUrl, "base")}
                    >
                      {copiedEndpoint === "base" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Authentication */}
            <section id="authentication">
              <h2 className="text-3xl font-bold mb-4">Authentication</h2>
              <p className="text-muted-foreground mb-6">
                The LokroGames API is currently public and does not require authentication. All endpoints are freely accessible.
              </p>
              <Card className="bg-yellow-500/10 border-yellow-500/30">
                <CardContent className="pt-6">
                  <p className="text-yellow-400 text-sm">
                    <strong>Note:</strong> Rate limiting may be applied in the future. Please use the API responsibly.
                  </p>
                </CardContent>
              </Card>
            </section>

            {/* Get User Endpoint */}
            <section id="get-user">
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-sm px-3 py-1">GET</Badge>
                <h2 className="text-3xl font-bold">Get User</h2>
              </div>
              <p className="text-muted-foreground mb-6">
                Retrieve user information by their UUID or username.
              </p>

              {/* Endpoint URL */}
              <Card className="bg-card/50 border-border/50 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Endpoint</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted/50 rounded-lg text-sm font-mono">
                      /v1/users
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`${baseUrl}/v1/users`, "endpoint")}
                    >
                      {copiedEndpoint === "endpoint" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Query Parameters */}
              <Card className="bg-card/50 border-border/50 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Query Parameters</CardTitle>
                  <CardDescription>One of the following parameters is required</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-4 font-medium">Parameter</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Required</th>
                          <th className="text-left py-3 px-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-border/30">
                          <td className="py-3 px-4"><code className="bg-muted/50 px-2 py-1 rounded">uid</code></td>
                          <td className="py-3 px-4 text-muted-foreground">string (UUID)</td>
                          <td className="py-3 px-4"><Badge variant="outline">Optional*</Badge></td>
                          <td className="py-3 px-4 text-muted-foreground">The user's unique identifier</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4"><code className="bg-muted/50 px-2 py-1 rounded">username</code></td>
                          <td className="py-3 px-4 text-muted-foreground">string</td>
                          <td className="py-3 px-4"><Badge variant="outline">Optional*</Badge></td>
                          <td className="py-3 px-4 text-muted-foreground">The user's username (case-insensitive)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-muted-foreground text-sm mt-4">
                    * At least one of <code className="bg-muted/50 px-1 rounded">uid</code> or <code className="bg-muted/50 px-1 rounded">username</code> must be provided.
                  </p>
                </CardContent>
              </Card>

              {/* Example Request/Response */}
              <Card className="bg-card/50 border-border/50 mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Examples</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="request" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="request">Request</TabsTrigger>
                      <TabsTrigger value="response">Response</TabsTrigger>
                    </TabsList>
                    <TabsContent value="request">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">By UUID:</p>
                          <code className="block p-4 bg-muted/50 rounded-lg text-sm font-mono break-all">
                            GET {baseUrl}/v1/users?uid=5775b5f3-3e4f-4540-8e83-ce35e345a238
                          </code>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">By Username:</p>
                          <code className="block p-4 bg-muted/50 rounded-lg text-sm font-mono break-all">
                            GET {baseUrl}/v1/users?username=Test1
                          </code>
                        </div>
                      </div>
                    </TabsContent>
                    <TabsContent value="response">
                      <pre className="p-4 bg-muted/50 rounded-lg text-sm font-mono overflow-x-auto">
{`{
  "user": {
    "uuid": "5775b5f3-3e4f-4540-8e83-ce35e345a238",
    "username": "Test1",
    "creditValue": "100",
    "statusActive": true,
    "joinedAt": "2025-12-27 12:40:38.952802+00",
    "_isBanned": false,
    "_banReason": null,
    "tag": null,
    "description": null,
    "xp": "3",
    "rank": 1,
    "role": "user",
    "avatar": "https://example.com/avatar.png",
    "lastCreditsRefill": "2025-12-27 12:40:38.952802+00"
  }
}`}
                      </pre>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Response Fields */}
              <Card className="bg-card/50 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Response Fields</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-4 font-medium">Field</th>
                          <th className="text-left py-3 px-4 font-medium">Type</th>
                          <th className="text-left py-3 px-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        <tr><td className="py-3 px-4"><code>uuid</code></td><td className="py-3 px-4 text-muted-foreground">string</td><td className="py-3 px-4 text-muted-foreground">User's unique identifier</td></tr>
                        <tr><td className="py-3 px-4"><code>username</code></td><td className="py-3 px-4 text-muted-foreground">string | null</td><td className="py-3 px-4 text-muted-foreground">Display username</td></tr>
                        <tr><td className="py-3 px-4"><code>creditValue</code></td><td className="py-3 px-4 text-muted-foreground">string</td><td className="py-3 px-4 text-muted-foreground">Current credit balance</td></tr>
                        <tr><td className="py-3 px-4"><code>statusActive</code></td><td className="py-3 px-4 text-muted-foreground">boolean</td><td className="py-3 px-4 text-muted-foreground">Whether user is active (not banned)</td></tr>
                        <tr><td className="py-3 px-4"><code>joinedAt</code></td><td className="py-3 px-4 text-muted-foreground">string</td><td className="py-3 px-4 text-muted-foreground">Account creation timestamp</td></tr>
                        <tr><td className="py-3 px-4"><code>_isBanned</code></td><td className="py-3 px-4 text-muted-foreground">boolean</td><td className="py-3 px-4 text-muted-foreground">Ban status</td></tr>
                        <tr><td className="py-3 px-4"><code>_banReason</code></td><td className="py-3 px-4 text-muted-foreground">string | null</td><td className="py-3 px-4 text-muted-foreground">Reason for ban if applicable</td></tr>
                        <tr><td className="py-3 px-4"><code>tag</code></td><td className="py-3 px-4 text-muted-foreground">string | null</td><td className="py-3 px-4 text-muted-foreground">Custom user tag</td></tr>
                        <tr><td className="py-3 px-4"><code>description</code></td><td className="py-3 px-4 text-muted-foreground">string | null</td><td className="py-3 px-4 text-muted-foreground">User bio/description</td></tr>
                        <tr><td className="py-3 px-4"><code>xp</code></td><td className="py-3 px-4 text-muted-foreground">string</td><td className="py-3 px-4 text-muted-foreground">Experience points</td></tr>
                        <tr><td className="py-3 px-4"><code>rank</code></td><td className="py-3 px-4 text-muted-foreground">number</td><td className="py-3 px-4 text-muted-foreground">Rank position (1-7)</td></tr>
                        <tr><td className="py-3 px-4"><code>role</code></td><td className="py-3 px-4 text-muted-foreground">string</td><td className="py-3 px-4 text-muted-foreground">User role (user, staff, admin, owner)</td></tr>
                        <tr><td className="py-3 px-4"><code>avatar</code></td><td className="py-3 px-4 text-muted-foreground">string | null</td><td className="py-3 px-4 text-muted-foreground">Avatar image URL</td></tr>
                        <tr><td className="py-3 px-4"><code>lastCreditsRefill</code></td><td className="py-3 px-4 text-muted-foreground">string</td><td className="py-3 px-4 text-muted-foreground">Last credit refill timestamp</td></tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Error Handling */}
            <section id="errors">
              <h2 className="text-3xl font-bold mb-4">Error Handling</h2>
              <p className="text-muted-foreground mb-6">
                The API uses standard HTTP status codes to indicate the success or failure of requests.
              </p>
              <Card className="bg-card/50 border-border/50">
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50">
                          <th className="text-left py-3 px-4 font-medium">Status Code</th>
                          <th className="text-left py-3 px-4 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        <tr>
                          <td className="py-3 px-4"><Badge className="bg-green-500/20 text-green-400">200</Badge></td>
                          <td className="py-3 px-4 text-muted-foreground">Success - Request completed successfully</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4"><Badge className="bg-yellow-500/20 text-yellow-400">400</Badge></td>
                          <td className="py-3 px-4 text-muted-foreground">Bad Request - Missing required parameters</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4"><Badge className="bg-red-500/20 text-red-400">404</Badge></td>
                          <td className="py-3 px-4 text-muted-foreground">Not Found - User or endpoint not found</td>
                        </tr>
                        <tr>
                          <td className="py-3 px-4"><Badge className="bg-red-500/20 text-red-400">500</Badge></td>
                          <td className="py-3 px-4 text-muted-foreground">Internal Server Error - Something went wrong</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border/50 mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Error Response Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="p-4 bg-muted/50 rounded-lg text-sm font-mono">
{`{
  "error": "User not found"
}`}
                  </pre>
                </CardContent>
              </Card>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
