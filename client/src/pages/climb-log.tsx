import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, Plus, MoreVertical, Edit, Trash2, CalendarDays, Mountain } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, parseISO, isWithinInterval } from "date-fns";
import LogClimbModal from "@/components/log-climb-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";

export default function ClimbLog() {
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingClimb, setEditingClimb] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: climbs = [], isLoading, error } = useQuery({
    queryKey: ["api", "climbs"],
  });



  const deleteClimbMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/climbs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "climbs"] });
      // Invalidate all stats queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "api" && key[1] === "stats";
        }
      });
      toast({ title: "Climb deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete climb", variant: "destructive" });
    },
  });

  // Filter climbs by date range if active
  const filteredClimbs = climbs.filter((climb: any) => {
    if (!dateRange?.from) return true;
    
    const climbDate = parseISO(climb.climbDate);
    
    if (dateRange.to) {
      // Range selection
      return isWithinInterval(climbDate, {
        start: dateRange.from,
        end: dateRange.to
      });
    } else {
      // Single date selection
      return format(climbDate, 'yyyy-MM-dd') === format(dateRange.from, 'yyyy-MM-dd');
    }
  });

  // Group filtered climbs by date
  const groupedClimbs = filteredClimbs.reduce((groups: any, climb: any) => {
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

  const handleMediaClick = (mediaUrl: string) => {
    const isVideo = mediaUrl.startsWith('data:video/');
    setSelectedMedia({
      url: mediaUrl,
      type: isVideo ? 'video' : 'image'
    });
    setShowMediaModal(true);
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
        <div className="flex-1"></div>
        <h2 className="text-2xl font-bold text-gray-900 text-center">Climb Log</h2>
        <div className="flex-1 flex items-center justify-end space-x-3">
          <Popover open={showDateFilter} onOpenChange={setShowDateFilter}>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`p-2 ${dateRange?.from ? 'text-blue-600 hover:text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Filter by date</h4>
                  {dateRange?.from && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDateRange(undefined)}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {dateRange?.from && (
                  <p className="text-xs text-gray-500 mt-1">
                    {dateRange.to 
                      ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                      : format(dateRange.from, 'MMM d, yyyy')
                    }
                  </p>
                )}
              </div>
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={1}
                className="rounded-md"
              />
            </PopoverContent>
          </Popover>
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
          <p className="text-gray-500 mb-4">
            {dateRange?.from ? "No climbs found for selected date range" : "No climbs logged yet"}
          </p>
          {!dateRange?.from && (
            <Button onClick={() => setShowLogModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Log your first climb
            </Button>
          )}
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
                        <div className="flex items-center space-x-3">
                          {/* Circular media section */}
                          <div className="flex-shrink-0">
                            <div 
                              className={`w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden ${climb.mediaUrl ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                              onClick={() => climb.mediaUrl && handleMediaClick(climb.mediaUrl)}
                            >
                              {climb.mediaUrl ? (
                                climb.mediaUrl.startsWith('data:video/') ? (
                                  <video
                                    src={climb.mediaUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (nextSibling) {
                                        nextSibling.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                ) : (
                                  <img
                                    src={climb.mediaUrl}
                                    alt="Climb media"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (nextSibling) {
                                        nextSibling.classList.remove('hidden');
                                      }
                                    }}
                                  />
                                )
                              ) : null}
                              <Mountain className={`w-6 h-6 text-gray-400 ${climb.mediaUrl ? 'hidden' : ''}`} />
                            </div>
                          </div>
                          
                          {/* Climb details */}
                          <div className="flex-1">
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

      {/* Media Modal */}
      <Dialog open={showMediaModal} onOpenChange={setShowMediaModal}>
        <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] p-0">
          <DialogHeader className="p-4">
            <DialogTitle>Media View</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {selectedMedia && (
              selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  controls
                  className="max-w-full max-h-[70vh] rounded-lg"
                  autoPlay
                />
              ) : (
                <img
                  src={selectedMedia.url}
                  alt="Full size climb media"
                  className="max-w-full max-h-[70vh] rounded-lg object-contain"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
