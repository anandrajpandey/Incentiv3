"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CREDENTIALS = {
  admin: {
    username: "admin",
    password: "admin123",
    role: "admin" as const,
  },
  user: {
    username: "user",
    password: "user123",
    role: "user" as const,
  },
};

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      let role: string | null = null;

      if (
        username === CREDENTIALS.admin.username &&
        password === CREDENTIALS.admin.password
      ) {
        role = CREDENTIALS.admin.role;
      } else if (
        username === CREDENTIALS.user.username &&
        password === CREDENTIALS.user.password
      ) {
        role = CREDENTIALS.user.role;
      }

      if (!role) {
        setError("Invalid username or password");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("userRole", role);
      localStorage.setItem("username", username);

      router.push(role === "admin" ? "/admin/dashboard" : "/user/dashboard");
    } catch (_err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-[#030014] text-white overflow-hidden">
      {/* ⭐ Falling space background */}
      <div className="absolute inset-0 bg-[url('/stars2.png')] opacity-60 animate-stars" />

      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(80,35,201,0.5),_transparent_75%)]" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-extrabold text-white drop-shadow-md mb-2">
            Incentiv3
          </h1>
          <p className="text-violet-200">Decentralized Bounty Platform</p>
        </div>

        <Card className="border-violet-500/40 bg-slate-900/70 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.4)]">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-violet-200">
              Welcome to Incentiv3
            </CardTitle>
            <CardDescription className="text-slate-300/80">
              Enter your credentials to Join the decentralized workforce
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-xs font-semibold uppercase text-violet-100 mb-1 block">
                  Username
                </label>
                <Input
                  placeholder="admin / user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-950/70 border-violet-500/40 text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-violet-100 mb-1 block">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="bg-slate-950/70 border-violet-500/40 text-white"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_18px_rgba(139,92,246,.5)]"
              >
                {isLoading ? "Verifying..." : "Launch Dashboard"}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <p className="text-xs font-semibold text-violet-200 mb-3 uppercase tracking-wide">
                Demo Credentials
              </p>
              <div className="space-y-2 text-sm">
                <p className="font-mono text-cyan-300">
                  Admin →{" "}
                  <span className="text-pink-400">admin / admin123</span>
                </p>
                <p className="font-mono text-cyan-300">
                  User → <span className="text-pink-400">user / user123</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
