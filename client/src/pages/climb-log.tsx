import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Pencil, Trash2, Mountain, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import LogClimbModal from "@/components/log-climb-modal";
import type { DateRange } from "react-day-picker";

export default function ClimbLog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editingClimb, setEditingClimb] = useState<any>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMedia, setSelectedMedia] = useState<{url: string, type: 'image' | 'video'} | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);

  const itemsPerPage = 20;

  // User-specific query key to prevent data leakage between users
  const { data: climbs = [] } = useQuery({
    queryKey: ["/api/climbs", user?.id],
    enabled: !!user?.id,
  });

  // Filter climbs by date range
  const filteredClimbs = dateRange?.from && dateRange?.to 
    ? climbs.filter((climb: any) => {
        const climbDate = new Date(climb.climbDate);
        return climbDate >= dateRange.from! && climbDate <= dateRange.to!;
      })
    : climbs;

  // Pagination
  const totalItems = filteredClimbs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClimbs = filteredClimbs.slice(startIndex, endIndex);

  const deleteClimbMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/climbs/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete climb');
      }
    },
    onSuccess: () => {
      // User-specific cache invalidation to prevent cross-user contamination
      queryClient.invalidateQueries({ queryKey: ["/api/climbs", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      // Invalidate today's stats for this user only
      queryClient.invalidateQueries({ queryKey: ["/api/stats/today", user?.id] });
      // Invalidate all stats queries for this user only
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return Array.isArray(key) && key[0]?.toString().includes("/api/stats") && key.includes(user?.id);
        }
      });
      toast({
        title: "Success",
        description: "Climb deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete climb",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClimb = (id: number) => {
    if (window.confirm("Are you sure you want to delete this climb?")) {
      deleteClimbMutation.mutate(id);
    }
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    setCurrentPage(1);
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

  const formatDateHeader = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch {
      return dateString;
    }
  };

  // Group climbs by date
  const groupClimbsByDate = (climbs: any[]) => {
    const grouped = climbs.reduce((acc: any, climb) => {
      const date = climb.climbDate.split('T')[0]; // Get just the date part
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(climb);
      return acc;
    }, {});

    // Sort dates in descending order (newest first)
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
    return sortedDates.map(date => ({
      date,
      climbs: grouped[date]
    }));
  };

  const groupedClimbs = groupClimbsByDate(paginatedClimbs);

  return (
    <div className="py-4 space-y-4">
      {/* Date Filter */}
      <div className="retro-container p-4">
        <div className="retro-label mb-3">Filter by Date Range</div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="retro-input w-full justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={1}
            />
          </PopoverContent>
        </Popover>

        {dateRange && (
          <Button 
            onClick={() => handleDateRangeChange(undefined)}
            variant="outline" 
            className="retro-button-secondary mt-2 w-full"
          >
            Clear Filter
          </Button>
        )}
      </div>



      {/* Climbs List */}
      <div className="space-y-4">
        {paginatedClimbs.length === 0 ? (
          <div className="retro-container p-8 text-center">
            <Mountain className="w-12 h-12 mx-auto mb-4 text-climb-gray" />
            <div className="retro-body text-climb-gray">
              {dateRange ? "No climbs found in selected date range" : "No climbs logged yet"}
            </div>
          </div>
        ) : (
          groupedClimbs.map((group) => (
            <div key={group.date} className="space-y-3">
              {/* Date Header */}
              <div className="retro-container-primary p-3">
                <h3 className="retro-title text-center">
                  {formatDateHeader(group.date)}
                </h3>
              </div>

              {/* Climbs for this date */}
              <div className="space-y-3">
                {group.climbs.map((climb: any) => (
                  <div key={climb.id} className="retro-container p-4">
                    <div className="flex items-start space-x-4">
                      {/* Media thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 retro-container-accent flex items-center justify-center overflow-hidden cursor-pointer"
                             onClick={() => climb.mediaUrl && handleMediaClick(climb.mediaUrl)}>
                          {climb.mediaUrl ? (
                            climb.mediaUrl.startsWith('data:video/') ? (
                              <video 
                                src={climb.mediaUrl} 
                                className="w-full h-full object-cover pixel-art"
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
                                alt="Climb" 
                                className="w-full h-full object-cover pixel-art"
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
                          <Mountain className={`w-6 h-6 text-climb-gray ${climb.mediaUrl ? 'hidden' : ''}`} />
                        </div>
                      </div>

                      {/* Climb details */}
                      <div className="flex-1">
                        <div className="retro-heading text-lg mb-1">
                          {climb.gym}
                        </div>
                        <div className="retro-body text-sm mb-2">
                          {climb.routeType} • {climb.grade} • {climb.outcome}
                        </div>
                        {climb.notes && (
                          <div className="retro-body text-sm text-climb-gray">
                            {climb.notes}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col space-y-2">
                        <Button
                          onClick={() => setEditingClimb(climb)}
                          size="sm"
                          className="retro-button-secondary px-3 py-2"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteClimb(climb.id)}
                          size="sm"
                          variant="destructive"
                          className="retro-button px-3 py-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="retro-container p-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="retro-button-secondary"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    className={currentPage === pageNum ? "retro-button" : "retro-button-secondary"}
                    size="sm"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="retro-button-secondary"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <LogClimbModal
        open={showLogModal || !!editingClimb}
        onOpenChange={(open) => {
          if (!open) {
            setShowLogModal(false);
            setEditingClimb(null);
          }
        }}
        climb={editingClimb}
      />

      <Dialog open={showMediaModal} onOpenChange={setShowMediaModal}>
        <DialogContent className="retro-container max-w-3xl">
          {selectedMedia && (
            selectedMedia.type === 'video' ? (
              <video 
                src={selectedMedia.url} 
                controls 
                className="w-full h-auto pixel-art"
              />
            ) : (
              <img 
                src={selectedMedia.url} 
                alt="Climb" 
                className="w-full h-auto pixel-art"
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}