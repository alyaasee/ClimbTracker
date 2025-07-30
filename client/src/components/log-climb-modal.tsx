import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Camera, Video, X } from "lucide-react";

interface LogClimbModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  climb?: any;
}

export default function LogClimbModal({ open, onOpenChange, climb }: LogClimbModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Fetch today's climbs to prefill date and location - user-specific
  const { data: todaysClimbs } = useQuery({
    queryKey: ["api", "climbs", { userId: user?.id }],
    queryFn: () => fetch('/api/climbs', { credentials: 'include' }).then(res => res.json()),
    enabled: open && !climb && !!user?.id, // Only fetch when modal is open and not editing
  });

  const getTodaysFirstClimb = () => {
    if (!todaysClimbs || !Array.isArray(todaysClimbs)) return null;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaysClimbsData = todaysClimbs.filter((c: any) => c.climbDate === today);
    
    return todaysClimbsData.length > 0 ? todaysClimbsData[0] : null;
  };

  const [formData, setFormData] = useState({
    climbDate: climb?.climbDate || format(new Date(), 'yyyy-MM-dd'),
    gym: climb?.gym || "",
    routeType: climb?.routeType || "",
    grade: climb?.grade || "",
    outcome: climb?.outcome || "",
    notes: climb?.notes || "",
    mediaUrl: climb?.mediaUrl || "",
  });

  // Update form data when modal opens with smart prefilling
  useEffect(() => {
    if (open && !climb) {
      const firstClimb = getTodaysFirstClimb();
      setFormData({
        climbDate: format(new Date(), 'yyyy-MM-dd'),
        gym: firstClimb?.gym || "",
        routeType: "",
        grade: "",
        outcome: "",
        notes: "",
        mediaUrl: "",
      });
    } else if (climb) {
      setFormData({
        climbDate: climb.climbDate || format(new Date(), 'yyyy-MM-dd'),
        gym: climb.gym || "",
        routeType: climb.routeType || "",
        grade: climb.grade || "",
        outcome: climb.outcome || "",
        notes: climb.notes || "",
        mediaUrl: climb.mediaUrl || "",
      });
    }
  }, [open, climb, todaysClimbs]);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const gymOptions = [
    "Camp5 KL Eco",
    "Camp5 KL East", 
    "Camp5 1U",
    "Camp5 Utro",
    "Camp5 Jumpa",
    "Batuu",
    "Bump J1",
    "Bump PBJ"
  ];

  const createClimbMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/climbs", { method: "POST", body: data }),
    onSuccess: () => {
      // User-specific cache invalidation to prevent cross-user contamination
      queryClient.invalidateQueries({ queryKey: ["api", "climbs", { userId: user?.id }] });
      queryClient.invalidateQueries({ queryKey: ["api", "auth", "user"] });
      queryClient.invalidateQueries({ queryKey: ["api", "user", { userId: user?.id }] });
      // Invalidate today's stats for this user only
      queryClient.invalidateQueries({ queryKey: ["api", "stats", "today", { userId: user?.id }] });
      // Invalidate all stats queries for this user only
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === "api" && key[1] === "stats" && 
                 key[2] && typeof key[2] === "object" && (key[2] as any)?.userId === user?.id;
        }
      });
      toast({ title: "Climb logged successfully!" });
      onOpenChange(false);
      // Reset form - this will be handled by useEffect when modal opens again
      setSelectedFiles([]);
    },
    onError: (error: any) => {
      console.error("Create climb error:", error);
      let errorMessage = "Failed to log climb";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Failed to log climb", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  const updateClimbMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/climbs/${climb?.id}`, { method: "PUT", body: data }),
    onSuccess: () => {
      // User-specific cache invalidation to prevent cross-user contamination
      queryClient.invalidateQueries({ queryKey: ["api", "climbs", { userId: user?.id }] });
      queryClient.invalidateQueries({ queryKey: ["api", "auth", "user"] });
      queryClient.invalidateQueries({ queryKey: ["api", "user", { userId: user?.id }] });
      // Invalidate today's stats for this user only
      queryClient.invalidateQueries({ queryKey: ["api", "stats", "today", { userId: user?.id }] });
      // Invalidate all stats queries for this user only
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0] === "api" && key[1] === "stats" && 
                 key[2] && typeof key[2] === "object" && (key[2] as any)?.userId === user?.id;
        }
      });
      toast({ title: "Climb updated successfully!" });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Update climb error:", error);
      let errorMessage = "Failed to update climb";
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({ 
        title: "Failed to update climb", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  const compressImage = (file: File, maxSizeBytes: number = 5 * 1024 * 1024): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Start with high quality and reduce until under size limit
        let quality = 0.9;
        const tryCompress = () => {
          canvas.toBlob((blob) => {
            if (blob && blob.size <= maxSizeBytes) {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(blob);
            } else if (quality > 0.1) {
              quality -= 0.1;
              tryCompress();
            } else {
              reject(new Error('Cannot compress image below 5MB'));
            }
          }, 'image/jpeg', quality);
        };
        
        tryCompress();
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const compressVideo = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.onloadedmetadata = () => {
        // Limit video dimensions
        const maxWidth = 1280;
        const maxHeight = 720;
        let { videoWidth: width, videoHeight: height } = video;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Capture first frame as thumbnail
        video.currentTime = 0;
        video.onseeked = () => {
          ctx?.drawImage(video, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target?.result as string);
              reader.readAsDataURL(blob);
            } else {
              reject(new Error('Failed to compress video'));
            }
          }, 'image/jpeg', 0.8);
        };
      };
      
      video.onerror = () => reject(new Error('Failed to load video'));
      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      
      try {
        let dataUrl: string;
        
        if (firstFile.size > 5 * 1024 * 1024) {
          // File is too large, compress it
          if (firstFile.type.startsWith('image/')) {
            dataUrl = await compressImage(firstFile);
            toast({ 
              title: "Image compressed", 
              description: "Large image was automatically compressed to reduce size"
            });
          } else if (firstFile.type.startsWith('video/')) {
            dataUrl = await compressVideo(firstFile);
            toast({ 
              title: "Video compressed", 
              description: "Large video was converted to a thumbnail image"
            });
          } else {
            toast({ 
              title: "File too large", 
              description: "Please select an image or video smaller than 5MB",
              variant: "destructive" 
            });
            return;
          }
        } else {
          // File is within size limit, use as-is
          const reader = new FileReader();
          dataUrl = await new Promise((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(firstFile);
          });
        }
        
        setFormData(prev => ({ ...prev, mediaUrl: dataUrl }));
      } catch (error) {
        console.error("File compression error:", error);
        toast({ 
          title: "Compression failed", 
          description: "Unable to process the file. Please try a different file.",
          variant: "destructive" 
        });
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = prev.filter((_, i) => i !== index);
      if (newFiles.length === 0) {
        setFormData(prev => ({ ...prev, mediaUrl: "" }));
      }
      return newFiles;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.climbDate || !formData.gym || !formData.routeType || !formData.grade || !formData.outcome) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.climbDate)) {
      toast({ title: "Invalid date format", variant: "destructive" });
      return;
    }

    try {
      if (climb) {
        updateClimbMutation.mutate(formData);
      } else {
        createClimbMutation.mutate(formData);
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({ title: "Submission failed", description: "Please try again", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{climb ? "Edit Climb" : "Log Climb"}</DialogTitle>
          <DialogDescription>
            {climb ? "Edit your climb details" : "Log your climbing session"}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 4-Tile Card Layout */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date Card */}
            <div className="aa-overlay-content backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Label htmlFor="climbDate" className="text-xs font-semibold text-aa-dark mb-2 block">Date</Label>
              <Input
                id="climbDate"
                type="date"
                value={formData.climbDate}
                onChange={(e) => setFormData({ ...formData, climbDate: e.target.value })}
                required
                className="text-sm border-0 bg-transparent p-1 text-aa-dark font-medium"
              />
            </div>

            {/* Location Card */}
            <div className="aa-overlay-content backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Label className="text-xs font-semibold text-aa-dark mb-2 block">Location</Label>
              <Select
                value={formData.gym}
                onValueChange={(value) => setFormData({ ...formData, gym: value })}
              >
                <SelectTrigger className="text-sm border-0 bg-transparent p-1 h-auto text-aa-dark font-medium">
                  <SelectValue placeholder="Select gym" />
                </SelectTrigger>
                <SelectContent>
                  {gymOptions.map((gym) => (
                    <SelectItem key={gym} value={gym}>{gym}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Card */}
            <div className="aa-overlay-content backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Label className="text-xs font-semibold text-aa-dark mb-2 block">Style</Label>
              <Select
                value={formData.routeType}
                onValueChange={(value) => setFormData({ ...formData, routeType: value })}
              >
                <SelectTrigger className="text-sm border-0 bg-transparent p-1 h-auto text-aa-dark font-medium">
                  <SelectValue placeholder="Select route type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boulder">Boulder</SelectItem>
                  <SelectItem value="Top Rope">Top Rope</SelectItem>
                  <SelectItem value="Lead">Lead</SelectItem>
                  <SelectItem value="Auto Belay">Auto Belay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Grade Card */}
            <div className="aa-overlay-content backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Label className="text-xs font-semibold text-aa-dark mb-2 block">Grade</Label>
              <Select
                value={formData.grade}
                onValueChange={(value) => setFormData({ ...formData, grade: value })}
              >
                <SelectTrigger className="text-sm border-0 bg-transparent p-1 h-auto text-aa-dark font-medium">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7c">7c</SelectItem>
                  <SelectItem value="7b">7b</SelectItem>
                  <SelectItem value="7a">7a</SelectItem>
                  <SelectItem value="6c+">6c+</SelectItem>
                  <SelectItem value="6c">6c</SelectItem>
                  <SelectItem value="6b+">6b+</SelectItem>
                  <SelectItem value="6b">6b</SelectItem>
                  <SelectItem value="6a+">6a+</SelectItem>
                  <SelectItem value="6a">6a</SelectItem>
                  <SelectItem value="5c">5c</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Outcome and Photos/Videos - 2-Tile Card Layout */}
          <div className="grid grid-cols-2 gap-3">
            {/* Outcome Card */}
            <div className="aa-overlay-content backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Label htmlFor="outcome" className="text-xs font-semibold text-aa-dark mb-2 block">Outcome</Label>
              <Select
                value={formData.outcome}
                onValueChange={(value) => setFormData({ ...formData, outcome: value })}
              >
                <SelectTrigger className="text-sm border-0 bg-transparent p-1 h-auto text-aa-dark font-medium">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flash">Flash</SelectItem>
                  <SelectItem value="Send">Send</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Attempt">Attempt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Photos/Videos Card */}
            <div className="aa-overlay-content backdrop-blur-sm rounded-lg p-3 border border-white/20">
              <Label htmlFor="media" className="text-xs font-semibold text-aa-dark mb-2 block">Photos/Videos</Label>
              <div className="space-y-2">
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    className="flex-1 text-xs px-2 py-1 h-auto border-white/30 bg-white/20 text-aa-dark hover:bg-white/30"
                  >
                    <Camera className="w-3 h-3 mr-1" />
                    Photo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('video-upload')?.click()}
                    className="flex-1 text-xs px-2 py-1 h-auto border-white/30 bg-white/20 text-aa-dark hover:bg-white/30"
                  >
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Button>
                </div>
              
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <input
                id="video-upload"
                type="file"
                accept="video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

                {selectedFiles.length > 0 && (
                  <div className="space-y-1">
                    {selectedFiles.slice(0, 2).map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white/20 rounded p-1">
                        <div className="flex items-center space-x-1">
                          {file.type.startsWith('image/') ? (
                            <Camera className="w-3 h-3 text-aa-dark" />
                          ) : (
                            <Video className="w-3 h-3 text-aa-dark" />
                          )}
                          <span className="text-xs text-aa-dark truncate max-w-[60px]">
                            {file.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="p-0 h-4 w-4"
                        >
                          <X className="w-2 h-2 text-aa-dark" />
                        </Button>
                      </div>
                    ))}
                    {selectedFiles.length > 2 && (
                      <div className="text-xs text-aa-medium">+{selectedFiles.length - 2} more</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes - Horizontal Bar */}
          <div className="aa-overlay-content backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <Label htmlFor="notes" className="text-sm font-semibold text-aa-dark mb-3 block">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about the climb"
              rows={3}
              className="w-full border border-white/30 bg-white/20 text-aa-dark placeholder:text-aa-medium resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createClimbMutation.isPending || updateClimbMutation.isPending}
            >
              {climb ? "Update" : "Log"} Climb
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
