import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Camera, Save, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["api", "auth", "user"],
  });

  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    profileImageUrl: user?.profileImageUrl || "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        profileImageUrl: user.profileImageUrl || "",
      });
      setImagePreview(user.profileImageUrl || "");
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/profile", { method: "PUT", body: data }),
    onSuccess: () => {
      // Invalidate all user-related queries to ensure updates are reflected everywhere
      queryClient.invalidateQueries({ queryKey: ["api", "auth", "user"] });
      queryClient.invalidateQueries({ queryKey: ["api", "user"] });
      toast({ title: "Profile updated successfully!" });
    },
    onError: (error: any) => {
      console.error("Profile update error:", error);
      let errorMessage = "Failed to update profile";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Failed to update profile", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate dimensions to maintain aspect ratio
        const maxWidth = 400;
        const maxHeight = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({ 
          title: "Invalid file type", 
          description: "Please select an image file",
          variant: "destructive" 
        });
        return;
      }

      setSelectedFile(file);
      
      try {
        let dataUrl: string;
        
        if (file.size > 2 * 1024 * 1024) {
          // File is larger than 2MB, compress it
          dataUrl = await compressImage(file);
          toast({ 
            title: "Image compressed", 
            description: "Large image was automatically compressed"
          });
        } else {
          // File is within size limit, use as-is
          const reader = new FileReader();
          dataUrl = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        }
        
        setImagePreview(dataUrl);
        setFormData(prev => ({ ...prev, profileImageUrl: dataUrl }));
      } catch (error) {
        console.error("Image compression error:", error);
        toast({ 
          title: "Image processing failed", 
          description: "Unable to process the image. Please try a different file.",
          variant: "destructive" 
        });
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim()) {
      toast({ title: "Please enter your name", variant: "destructive" });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="py-2 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            <span className="text-white font-bold text-xl">🧗</span>
          </div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-2 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => setLocation("/")}
        className="mb-4 p-2 -ml-2"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        Back
      </Button>

      {/* Profile Header */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden">
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById('profile-photo-upload')?.click()}
            className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
          >
            <Camera className="w-4 h-4" />
          </Button>
          <input
            id="profile-photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {formData.firstName || "User"}
          </h2>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="firstName" className="form-label">Name</Label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Enter your name"
                required
                className="form-input"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}