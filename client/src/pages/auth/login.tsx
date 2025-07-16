import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Login() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const sendCodeMutation = useMutation({
    mutationFn: async ({ email, name }: { email: string; name: string }) => {
      await apiRequest(`/api/auth/send-code`, {
        method: "POST",
        body: { email, name }
      });
    },
    onSuccess: () => {
      toast({
        title: "Code sent!",
        description: "Please check your email for the verification code.",
      });
      setLocation(`/auth/verify?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    },
  });

  const googleAuthMutation = useMutation({
    mutationFn: async () => {
      // For now, redirect to Google OAuth (would need proper setup)
      window.location.href = "/api/auth/google";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive",
      });
    },
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter your name",
        variant: "destructive",
      });
      return;
    }
    sendCodeMutation.mutate({ email, name });
  };

  const handleGoogleLogin = () => {
    googleAuthMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm bg-white rounded-3xl shadow-xl">
        <CardContent className="p-8">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">🧗</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Hi, Climber!
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Please enter your details to get started
          </p>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 bg-gray-50 border-0 rounded-xl px-4 text-gray-900 placeholder-gray-500"
              disabled={sendCodeMutation.isPending}
            />
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 bg-gray-50 border-0 rounded-xl px-4 text-gray-900 placeholder-gray-500"
              disabled={sendCodeMutation.isPending}
            />
            
            <Button
              type="submit"
              className="w-full h-12 bg-blue-400 hover:bg-blue-500 text-white rounded-xl font-medium"
              disabled={sendCodeMutation.isPending}
            >
              {sendCodeMutation.isPending ? "Sending..." : "Continue"}
            </Button>
          </form>

          {/* Google Sign In */}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12 mt-4 bg-gray-900 hover:bg-gray-800 text-white border-0 rounded-xl font-medium"
            disabled={googleAuthMutation.isPending}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}