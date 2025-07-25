import { useState, useEffect } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// CLIMB-CADE Pixel Art Mountain Icon Component
function ClimbCadeIcon() {
  return (
    <div className="w-16 h-16 flex items-center justify-center retro-container" style={{ background: 'linear-gradient(135deg, #CEE4D2 0%, #EF7326 100%)' }}>
      <svg width="32" height="32" viewBox="0 0 32 32" className="pixel-art">
        {/* Pixel art mountain - inspired by CLIMB-CADE app icon */}
        <rect x="14" y="6" width="4" height="2" fill="#1F1F1F"/>
        <rect x="12" y="8" width="8" height="2" fill="#1F1F1F"/>
        <rect x="10" y="10" width="12" height="2" fill="#1F1F1F"/>
        <rect x="8" y="12" width="16" height="2" fill="#1F1F1F"/>
        <rect x="6" y="14" width="20" height="2" fill="#1F1F1F"/>
        <rect x="4" y="16" width="24" height="2" fill="#1F1F1F"/>
        <rect x="2" y="18" width="28" height="8" fill="#1F1F1F"/>

        {/* Mountain fill with gradient colors */}
        <rect x="14" y="8" width="4" height="2" fill="#EF7326"/>
        <rect x="12" y="10" width="8" height="2" fill="#EF7326"/>
        <rect x="10" y="12" width="12" height="2" fill="#EF7326"/>
        <rect x="8" y="14" width="16" height="2" fill="#EF7326"/>
        <rect x="6" y="16" width="20" height="2" fill="#EF7326"/>
        <rect x="4" y="18" width="24" height="6" fill="#EF7326"/>

        {/* Peak highlight */}
        <rect x="15" y="8" width="2" height="2" fill="#FCFCF9"/>
        <rect x="13" y="10" width="6" height="2" fill="#FCFCF9"/>
      </svg>
    </div>
  );
}

export default function Verify() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const nameParam = params.get("name");
    console.log("Verify page loaded with params:", { emailParam, nameParam });
    if (emailParam) {
      setEmail(emailParam);
      console.log("Email set to:", emailParam);
    } else {
      console.log("No email parameter found in URL");
    }
    if (nameParam) {
      setName(nameParam);
    }
  }, []);

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ email, code }: { email: string; code: string }) => {
      console.log(`🚀 Frontend: Starting verification process`);
      console.log(`   Email: "${email}"`);
      console.log(`   Code: "${code}" (length: ${code.length})`);
      console.log(`   Name: "${name}"`);
      console.log(`   URL: /api/auth/verify-code`);
      
      try {
        const result = await apiRequest(`/api/auth/verify-code`, {
          method: "POST",
          body: { email, code, name }
        });
        console.log(`✅ Frontend: Verification successful`, result);
        return result;
      } catch (error) {
        console.error(`❌ Frontend: Verification failed`, error);
        console.error(`   Error details:`, error);
        throw error;
      }
    },
    onSuccess: async () => {
      // Invalidate the auth query to refresh user state
      await queryClient.invalidateQueries({ queryKey: ["auth", "user"] });

      toast({
        title: "Welcome!",
        description: "You have successfully logged in.",
      });

      // Force a page reload to ensure authentication state is properly updated
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error(`❌ Frontend: Verification error details:`, error);
      
      // Extract the actual error message from the server response
      let errorMessage = "Please check your code and try again.";
      let errorTitle = "Invalid code";
      
      if (error.message) {
        errorMessage = error.message;
        
        // Check if it's actually a server error vs invalid code
        if (error.message.includes("Failed to") || error.message.includes("Error")) {
          errorTitle = "Verification Error";
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });
      setCode("");
    },
  });

  const resendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest(`/api/auth/send-code`, {
        method: "POST",
        body: { email, name }
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
    console.log(`📝 Code input changed: "${value}" (length: ${value.length})`);
    setCode(value);
    if (value.length === 6) {
      console.log(`🎯 Triggering verification for complete code: "${value}"`);
      verifyCodeMutation.mutate({ email, code: value });
    }
  };

  const handleResend = () => {
    if (email) {
      resendCodeMutation.mutate(email);
    }
  };

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: 'linear-gradient(228deg, rgba(206, 228, 210, 0.65) 35%, rgba(239, 115, 38, 0.65) 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="retro-container p-8 bg-[#FCFCF9]">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <ClimbCadeIcon />
          </div>

          {/* Title */}
          <h1 className="retro-title text-2xl text-center mb-2">
            Enter verification code
          </h1>
          <p className="retro-body text-center mb-8 text-[#1F1F1F]">
            We sent a code to {email || "your email"}
          </p>
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-center mb-4 p-2 bg-yellow-100 rounded text-xs">
              <p>Debug: Email = "{email}"</p>
              <p>Current URL: {window.location.href}</p>
            </div>
          )}

          {/* Code Input */}
          <div className="flex justify-center mb-4">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={handleCodeChange}
              disabled={verifyCodeMutation.isPending}
            >
              <InputOTPGroup className="gap-2">
                <InputOTPSlot index={0} className="retro-input w-12 h-12 text-center text-[#1F1F1F]" style={{ fontFamily: 'Space Mono, monospace', fontWeight: '700' }} />
                <InputOTPSlot index={1} className="retro-input w-12 h-12 text-center text-[#1F1F1F]" style={{ fontFamily: 'Space Mono, monospace', fontWeight: '700' }} />
                <InputOTPSlot index={2} className="retro-input w-12 h-12 text-center text-[#1F1F1F]" style={{ fontFamily: 'Space Mono, monospace', fontWeight: '700' }} />
                <InputOTPSlot index={3} className="retro-input w-12 h-12 text-center text-[#1F1F1F]" style={{ fontFamily: 'Space Mono, monospace', fontWeight: '700' }} />
                <InputOTPSlot index={4} className="retro-input w-12 h-12 text-center text-[#1F1F1F]" style={{ fontFamily: 'Space Mono, monospace', fontWeight: '700' }} />
                <InputOTPSlot index={5} className="retro-input w-12 h-12 text-center text-[#1F1F1F]" style={{ fontFamily: 'Space Mono, monospace', fontWeight: '700' }} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {/* Manual Verify Button for Testing */}
          {code.length === 6 && (
            <div className="flex justify-center mb-6">
              <button
                onClick={() => verifyCodeMutation.mutate({ email, code })}
                className="retro-button-primary px-6 py-2 retro-bounce"
                disabled={verifyCodeMutation.isPending}
              >
                {verifyCodeMutation.isPending ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          )}

          {verifyCodeMutation.isPending && (
            <div className="text-center mb-6">
              <p className="retro-body text-[#9BA0A5] text-sm">Verifying code...</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-4">
            {/* Quick bypass button for development */}
            <button
              onClick={() => {
                const emailToUse = email || "test@example.com";
                console.log(`🔧 Bypass button clicked with email: "${emailToUse}"`);
                setCode("999999");
                verifyCodeMutation.mutate({ email: emailToUse, code: "999999" });
              }}
              className="retro-button-primary w-full p-3 retro-bounce"
              disabled={verifyCodeMutation.isPending}
            >
              {verifyCodeMutation.isPending ? "Verifying..." : "Use Bypass Code (999999)"}
            </button>

            <button
              onClick={handleResend}
              className="retro-button-secondary w-full p-3 retro-bounce"
              disabled={resendCodeMutation.isPending}
            >
              {resendCodeMutation.isPending ? "Sending..." : "Resend code"}
            </button>

            <button
              onClick={handleBack}
              className="w-full p-3 retro-body text-[#9BA0A5] hover:text-[#1F1F1F] transition-colors"
              style={{ fontFamily: 'Space Mono, monospace', fontWeight: '600' }}
            >
              Back to login
            </button>
          </div>

          {/* Footer branding */}
          <div className="text-center mt-8 pt-6 border-t-2 border-[#1F1F1F]">
            <div className="flex items-center justify-center space-x-2">
              <svg width="16" height="16" viewBox="0 0 16 16" className="pixel-art">
                <rect x="6" y="2" width="4" height="2" fill="#EF7326"/>
                <rect x="4" y="4" width="8" height="2" fill="#EF7326"/>
                <rect x="2" y="6" width="12" height="6" fill="#EF7326"/>
                <rect x="7" y="4" width="2" height="2" fill="#FCFCF9"/>
              </svg>
              <span className="retro-label text-[#1F1F1F] text-sm">Made by Alyaa</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}