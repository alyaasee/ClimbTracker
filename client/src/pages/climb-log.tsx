import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, Plus, MoreVertical, Edit, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format, parseISO } from "date-fns";
import LogClimbModal from "@/components/log-climb-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ClimbLog() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingClimb, setEditingClimb] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: climbs = [] } = useQuery({
    queryKey: ["/api/climbs"],
  });

  const deleteClimbMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/climbs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/climbs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today"] });
      toast({ title: "Climb deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete climb", variant: "destructive" });
    },
  });

  // Group climbs by date
  const groupedClimbs = climbs.reduce((groups: any, climb: any) => {
    const date = climb.climbDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(climb);
    return groups;
  }, {});

  const handleEditClimb = (climb: any) => {
    setEditingClimb(climb);
    setShowLogModal(true);
  };

  const handleDeleteClimb = (id: number) => {
    if (window.confirm("Are you sure you want to delete this climb?")) {
      deleteClimbMutation.mutate(id);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  const formatShortDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM d, yyyy').toUpperCase();
    } catch {
      return dateString.toUpperCase();
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Climb Log</h2>
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="p-2 text-gray-600 hover:text-gray-900">
            <Filter className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowLogModal(true)}
            className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center p-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {Object.keys(groupedClimbs).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No climbs logged yet</p>
          <Button onClick={() => setShowLogModal(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Log your first climb
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedClimbs).map(([date, dateClimbs]: [string, any[]]) => (
            <div key={date} className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {formatDate(date)}
              </h3>
              <div className="space-y-2">
                {dateClimbs.map((climb: any) => (
                  <Card key={climb.id} className="bg-white shadow-sm border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-gray-500 mb-1">
                            {formatShortDate(climb.climbDate)}
                          </div>
                          <div className="font-semibold text-gray-900">
                            {climb.gym}
                          </div>
                          <div className="text-sm text-gray-600">
                            {climb.routeType} • {climb.grade} • {climb.outcome}
                          </div>
                          {climb.notes && (
                            <div className="text-sm text-gray-500 mt-1">
                              {climb.notes}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2 text-gray-400 hover:text-gray-600"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClimb(climb)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClimb(climb.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <LogClimbModal
        open={showLogModal}
        onOpenChange={(open) => {
          setShowLogModal(open);
          if (!open) {
            setEditingClimb(null);
          }
        }}
        climb={editingClimb}
      />
    </div>
  );
}
