import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface LogClimbModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  climb?: any;
}

export default function LogClimbModal({ open, onOpenChange, climb }: LogClimbModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    gym: climb?.gym || "",
    routeType: climb?.routeType || "",
    grade: climb?.grade || "",
    outcome: climb?.outcome || "",
    notes: climb?.notes || "",
    climbDate: climb?.climbDate || format(new Date(), 'yyyy-MM-dd'),
  });

  const createClimbMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/climbs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/climbs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({ title: "Climb logged successfully!" });
      onOpenChange(false);
      setFormData({
        gym: "",
        routeType: "",
        grade: "",
        outcome: "",
        notes: "",
        climbDate: format(new Date(), 'yyyy-MM-dd'),
      });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.gym || !formData.routeType || !formData.grade || !formData.outcome) {
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
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="gym">Gym *</Label>
            <Input
              id="gym"
              value={formData.gym}
              onChange={(e) => setFormData({ ...formData, gym: e.target.value })}
              placeholder="e.g., Camp5 - KL East"
              required
            />
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
