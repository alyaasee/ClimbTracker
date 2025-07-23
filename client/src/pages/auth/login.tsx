import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import climbCadeIcon from "@assets/CLIMB-CADE App Icon_1753260765331.png";

// CLIMB-CADE App Icon Component
function ClimbCadeIcon() {
  return (
    <div className="w-20 h-20 flex items-center justify-center">
      <img 
        src={climbCadeIcon} 
        alt="CLIMB-CADE" 
        className="w-16 h-16 rounded-xl shadow-lg"
      />
    </div>
  );
}

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
            Hi, Climber!
          </h1>
          <p className="retro-body text-center mb-8 text-[#1F1F1F]">
            Please enter your name and email address
          </p>

          {/* Login Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="retro-input w-full p-4 text-[#1F1F1F] placeholder-[#9BA0A5]"
                disabled={sendCodeMutation.isPending}
                style={{ fontFamily: 'Space Mono, monospace', fontWeight: '600' }}
              />
            </div>
            
            <div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="retro-input w-full p-4 text-[#1F1F1F] placeholder-[#9BA0A5]"
                disabled={sendCodeMutation.isPending}
                style={{ fontFamily: 'Space Mono, monospace', fontWeight: '600' }}
              />
            </div>
            
            <button
              type="submit"
              className="retro-button w-full p-4 retro-bounce"
              disabled={sendCodeMutation.isPending}
              style={{ background: '#CEE4D2', color: '#1F1F1F' }}
            >
              {sendCodeMutation.isPending ? "Sending..." : "Continue"}
            </button>
          </form>

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