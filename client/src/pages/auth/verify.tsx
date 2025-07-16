import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Verify() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, []);

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      const response = await apiRequest(`/api/auth/verify-code`, {
        method: "POST",
        body: { email, code }
      });
      return response;
    },
    onSuccess: async () => {
      // Invalidate the auth query to refresh user state
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      
      toast({
        title: "Welcome!",
        description: "You have successfully logged in.",
      });
      
      // Small delay to ensure state is updated before redirect
      setTimeout(() => {
        setLocation("/");
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Invalid code",
        description: error.message || "Please check your code and try again.",
        variant: "destructive",
      });
      setCode("");
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest(`/api/auth/send-code`, {
        method: "POST",
        body: { email }
      });
    },
    onSuccess: () => {
      toast({
        title: "Code sent!",
        description: "A new verification code has been sent to your email.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to resend verification code",
        variant: "destructive",
      });
    },
  });

  const handleCodeChange = (value: string) => {
    setCode(value);
    if (value.length === 6) {
      verifyCodeMutation.mutate({ email, code: value });
    }
  };

  const handleResend = () => {
    if (email) {
      resendCodeMutation.mutate(email);
    }
  };

  const handleBack = () => {
    setLocation("/auth/login");
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
            Enter verification code
          </h1>
          <p className="text-gray-600 text-center mb-8">
            We sent a code to {email}
          </p>

          {/* Code Input */}
          <div className="flex justify-center mb-8">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              disabled={verifyCodeMutation.isPending}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Resend and Back buttons */}
          <div className="space-y-4">
            <Button
              onClick={handleResend}
              variant="ghost"
              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              disabled={resendCodeMutation.isPending}
            >
              {resendCodeMutation.isPending ? "Sending..." : "Resend code"}
            </Button>
            
            <Button
              onClick={handleBack}
              variant="outline"
              className="w-full"
            >
              Back to login
            </Button>
          </div>

          {verifyCodeMutation.isPending && (
            <div className="text-center mt-4">
              <p className="text-gray-500 text-sm">Verifying code...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}