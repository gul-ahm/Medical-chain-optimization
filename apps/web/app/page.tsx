import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LayoutDashboard, Boxes, BarChart3, Warehouse, Bot, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold tracking-tight" aria-label="Medical Supply Intelligence Platform">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Antigravity
          </span>
          <span className="ml-2 font-light text-muted-foreground">Medical Intelligence</span>
        </h1>
        <nav aria-label="Primary navigation" className="flex items-center gap-6">
          <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">Enter Dashboard</Link>
          <Link href="/dashboard/executive" className="text-sm font-medium hover:text-primary transition-colors">Executive View</Link>
          <div className="h-4 w-[1px] bg-border" />
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Operations
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-5xl font-extrabold tracking-tight mb-6">
          Global Medical Supply Chain <br />
          <span className="text-primary">Optimized by Clinical AI</span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Stabilize medicine stock, optimize redistribution, and forecast disease-driven demand with real-time intelligence.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard" className="bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20">
            Launch Control Tower
          </Link>
          <Link href="/dashboard/inventory" className="bg-secondary text-secondary-foreground px-8 py-3 rounded-md font-semibold hover:bg-secondary/90 transition-all border">
            View Medicine Inventory
          </Link>
        </div>
      </section>

      {/* Dashboard Cards */}
      <section className="max-w-7xl mx-auto grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Executive Command Center */}
        <Link href="/dashboard/executive">
          <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Medical Control Tower</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Real‑time clinical operational overview and AI‑driven decision hub for supply chain visibility.
            </CardContent>
          </Card>
        </Link>

        {/* Inventory Intelligence */}
        <Link href="/dashboard/inventory">
          <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Boxes className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Medicine Inventory</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Predictive medicine stock levels, batch-level expiry detection, and automated replenishment.
            </CardContent>
          </Card>
        </Link>

        {/* Forecasting Intelligence */}
        <Link href="/dashboard/forecasting">
          <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Demand Forecasting</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              AI‑powered epidemiology-linked demand forecasting with SHAP-based explainability.
            </CardContent>
          </Card>
        </Link>

        {/* Warehouse Optimization */}
        <Link href="/dashboard/optimization">
          <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Warehouse className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Supply Redistribution</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Intelligent multi-node balancing to prevent regional medicine shortages and wastage.
            </CardContent>
          </Card>
        </Link>

        {/* Agent Orchestration */}
        <Link href="/dashboard/orchestration">
          <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Autonomous Logistics</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Monitor autonomous agent fleets managing cold-chain integrity and medicine delivery.
            </CardContent>
          </Card>
        </Link>

        {/* Governance & Compliance */}
        <Link href="/dashboard/global-control-tower">
          <Card className="h-full hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Clinical Governance</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              Ensuring regulatory compliance, batch safety, and automated audit trails.
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto flex items-center justify-between p-10 border-t mt-20 text-sm text-muted-foreground">
        <span>© {new Date().getFullYear()} Antigravity Medical Intelligence Platform. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <Link href="/status" className="hover:text-primary transition-colors">Infrastructure Status</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </main>
  );
}
