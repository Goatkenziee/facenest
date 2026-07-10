"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Presentational auth form — wire onSubmit to Clerk/your backend.
export function AuthForm({ mode = "signin", onSubmit }: {
  mode?: "signin" | "signup"; onSubmit?: (email: string, password: string) => void;
}) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const isSignup = mode === "signup";
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm animate-fade-up">
        <CardHeader>
          <CardTitle>{isSignup ? "Create your account" : "Welcome back"}</CardTitle>
          <CardDescription>{isSignup ? "Start in less than a minute." : "Sign in to continue."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSubmit?.(email, password); }}>
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required /></div>
            <div className="space-y-1.5"><Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required /></div>
            <Button className="w-full" type="submit">{isSignup ? "Create account" : "Sign in"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
