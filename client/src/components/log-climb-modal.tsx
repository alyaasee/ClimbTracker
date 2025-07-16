import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  
  const [formData, setFormData] = useState({
    climbDate: climb?.climbDate || format(new Date(), 'yyyy-MM-dd'),
    gym: climb?.gym || "",
    routeType: climb?.routeType || "",
    grade: climb?.grade || "",
    outcome: climb?.outcome || "",
    notes: climb?.notes || "",
  });

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
    mutationFn: (data: any) => apiRequest("POST", "/api/climbs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/climbs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Climb logged successfully!" });
      onOpenChange(false);
      setFormData({
        climbDate: format(new Date(), 'yyyy-MM-dd'),
        gym: "",
        routeType: "",
        grade: "",
        outcome: "",
        notes: "",
      });
      setSelectedFiles([]);
    },
    onError: () => {
      toast({ title: "Failed to log climb", variant: "destructive" });
    },
  });

  const updateClimbMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/climbs/${climb?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/climbs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      toast({ title: "Climb updated successfully!" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "Failed to update climb", variant: "destructive" });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.climbDate || !formData.gym || !formData.routeType || !formData.grade || !formData.outcome) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (climb) {
      updateClimbMutation.mutate(formData);
    } else {
      createClimbMutation.mutate(formData);
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
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="climbDate">Date *</Label>
            <Input
              id="climbDate"
              type="date"
              value={formData.climbDate}
              onChange={(e) => setFormData({ ...formData, climbDate: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="gym">Gym *</Label>
            <Select
              value={formData.gym}
              onValueChange={(value) => setFormData({ ...formData, gym: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select gym" />
              </SelectTrigger>
              <SelectContent>
                {gymOptions.map((gym) => (
                  <SelectItem key={gym} value={gym}>{gym}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="routeType">Route Type *</Label>
            <Select
              value={formData.routeType}
              onValueChange={(value) => setFormData({ ...formData, routeType: value })}
            >
              <SelectTrigger>
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

          <div>
            <Label htmlFor="grade">Grade *</Label>
            <Select
              value={formData.grade}
              onValueChange={(value) => setFormData({ ...formData, grade: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5a">5a</SelectItem>
                <SelectItem value="5b">5b</SelectItem>
                <SelectItem value="5c">5c</SelectItem>
                <SelectItem value="6a">6a</SelectItem>
                <SelectItem value="6b">6b</SelectItem>
                <SelectItem value="6c">6c</SelectItem>
                <SelectItem value="7a">7a</SelectItem>
                <SelectItem value="7b">7b</SelectItem>
                <SelectItem value="7c">7c</SelectItem>
                <SelectItem value="8a">8a</SelectItem>
                <SelectItem value="8b">8b</SelectItem>
                <SelectItem value="8c">8c</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="outcome">Outcome *</Label>
            <Select
              value={formData.outcome}
              onValueChange={(value) => setFormData({ ...formData, outcome: value })}
            >
              <SelectTrigger>
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

          <div>
            <Label htmlFor="media">Photos/Videos</Label>
            <div className="space-y-2">
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  className="flex-1"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Add Photo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('video-upload')?.click()}
                  className="flex-1"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Add Video
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
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {file.type.startsWith('image/') ? (
                            <Camera className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Video className="w-4 h-4 text-purple-600" />
                          )}
                          <span className="text-sm text-gray-600 truncate">
                            {file.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="p-1 h-6 w-6"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Optional notes about the climb"
              rows={3}
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
