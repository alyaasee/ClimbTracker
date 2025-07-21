import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, Plus, MoreVertical, Edit, Trash2, CalendarDays, Mountain, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const LOGS_PER_PAGE = 20;

  const { data: climbs = [], isLoading, error } = useQuery({
    queryKey: ["api", "climbs"],
  });



  const deleteClimbMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/climbs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "climbs"] });
      // Invalidate all stats queries including today's stats
      queryClient.invalidateQueries({ queryKey: ["api", "stats", "today"] });
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

  // Sort climbs by date (newest first) and apply pagination
  const sortedClimbs = [...filteredClimbs].sort((a, b) => 
    new Date(b.climbDate).getTime() - new Date(a.climbDate).getTime()
  );
  
  const totalClimbs = sortedClimbs.length;
  const totalPages = Math.ceil(totalClimbs / LOGS_PER_PAGE);
  
  // Get climbs for current page
  const startIndex = (currentPage - 1) * LOGS_PER_PAGE;
  const endIndex = startIndex + LOGS_PER_PAGE;
  const paginatedClimbsArray = sortedClimbs.slice(startIndex, endIndex);
  
  // Group paginated climbs by date
  const paginatedClimbs = paginatedClimbsArray.reduce((groups: any, climb: any) => {
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

  // Reset to page 1 when date range filter changes
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

  return (
    <div className="py-4 page-transition">


      {Object.keys(paginatedClimbs).length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <p className="text-gray-800 mb-4 font-medium">
              {dateRange?.from ? "No climbs found for selected date range" : "No climbs logged yet"}
            </p>
          {!dateRange?.from && (
            <Button onClick={() => setShowLogModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Log your first climb
            </Button>
          )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(paginatedClimbs).map(([date, dateClimbs]: [string, any[]], index) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-between bg-white/15 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDate(date)}
                </h3>
                {index === 0 && (
                  <div className="flex items-center space-x-3">
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
                                onClick={() => handleDateRangeChange(undefined)}
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
                          onSelect={handleDateRangeChange}
                          numberOfMonths={1}
                          className="rounded-md"
                        />
                      </PopoverContent>
                    </Popover>
                    <Button
                      onClick={() => setShowLogModal(true)}
                      className="w-10 h-10 bg-gradient-to-r from-[#CEE4D2] to-[#EF7326] hover:from-[#B8D4BE] hover:to-[#E5631A] text-gray-800 rounded-full flex items-center justify-center p-0 shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {dateClimbs.map((climb: any) => (
                  <Card key={climb.id} className="bg-white/85 backdrop-blur-sm shadow-sm border border-white/30 card-transition">
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/20">
          <div className="aa-overlay-medium backdrop-blur-sm rounded-lg px-4 py-2">
            <span className="text-sm text-aa-medium">
              Showing {Math.min(startIndex + 1, totalClimbs)} to {Math.min(endIndex, totalClimbs)} of {totalClimbs} climbs
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="aa-overlay-medium backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 p-0 ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'aa-overlay-medium backdrop-blur-sm'}`}
                >
                  {pageNum}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="aa-overlay-medium backdrop-blur-sm"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
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
