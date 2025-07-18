import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mountain, TrendingUp, Target } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export default function Stats() {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Get available months with climbs
  const { data: availableMonths = [] } = useQuery({
    queryKey: ["api", "stats", "available-months"],
  });

  // Set default selection to the most recent month with climbs
  useEffect(() => {
    if (availableMonths.length > 0 && selectedYear === null && selectedMonth === null) {
      setSelectedYear(availableMonths[0].year);
      setSelectedMonth(availableMonths[0].month);
    }
  }, [availableMonths, selectedYear, selectedMonth]);

  const { data: monthlyStats, isLoading: monthlyStatsLoading } = useQuery({
    queryKey: ["api", "stats", "monthly", selectedYear, selectedMonth],
    queryFn: () => apiRequest(`/api/stats/monthly?year=${selectedYear}&month=${selectedMonth}`),
    enabled: selectedYear !== null && selectedMonth !== null,
  });

  const { data: gradeProgressionData = [] } = useQuery({
    queryKey: ["api", "stats", "grade-progression", selectedYear, selectedMonth],
    queryFn: () => apiRequest(`/api/stats/grade-progression?year=${selectedYear}&month=${selectedMonth}`),
    enabled: selectedYear !== null && selectedMonth !== null,
  });

  const formatMonthValue = (year: number, month: number) => {
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[month - 1];
    return `${monthName.slice(0, 3)} ${year}`;
  };

  // Route type colors
  const routeTypeColors = {
    'Boulder': '#3B82F6',
    'Top Rope': '#EF4444', 
    'Lead': '#10B981',
    'Auto Belay': '#F59E0B'
  };

  // Empty state check
  const isEmpty = selectedYear === null || selectedMonth === null || !monthlyStats || monthlyStats.totalClimbs === 0;

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 pl-2">Stats</h2>
      
      {/* Month Selector */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Select Month
        </Label>
        <Select
          value={selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}` : undefined}
          onValueChange={(value) => {
            if (value) {
              const [year, month] = value.split('-');
              setSelectedYear(parseInt(year));
              setSelectedMonth(parseInt(month));
            }
          }}
        >
          <SelectTrigger className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {availableMonths.map(({ year, month }) => (
              <SelectItem key={`${year}-${month}`} value={`${year}-${month.toString().padStart(2, '0')}`}>
                {formatMonthValue(year, month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isEmpty ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-2">
            {availableMonths.length === 0 ? "No climbs yet—get on the wall!" : "Select a month to see your stats"}
          </div>
          <div className="text-gray-400 text-sm">
            {availableMonths.length === 0 ? "Start logging climbs to see your progress" : "Choose a month with logged climbs from the dropdown above"}
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardContent className="p-4 text-center flex flex-col items-center min-h-[100px]">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Mountain className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="text-sm text-gray-600 mb-1 h-5 flex items-center">Max Grade</div>
                <div className="text-2xl font-bold text-gray-900 h-8 flex items-center">
                  {monthlyStats?.maxGrade || '5a'}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardContent className="p-4 text-center flex flex-col items-center min-h-[100px]">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-sm text-gray-600 mb-1 h-5 flex items-center">Total Climbs</div>
                <div className="text-2xl font-bold text-gray-900 h-8 flex items-center">
                  {monthlyStats?.totalClimbs || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white shadow-sm border border-gray-100">
              <CardContent className="p-4 text-center flex flex-col items-center min-h-[100px]">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-sm text-gray-600 mb-1 h-5 flex items-center">Success Rate</div>
                <div className="text-2xl font-bold text-gray-900 h-8 flex items-center">
                  {monthlyStats?.successRate || 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Progression Chart */}
          <Card className="bg-white shadow-sm border border-gray-100 mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Grade Progression
              </h3>
              
              {gradeProgressionData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gradeProgressionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month"
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[1, 10]}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const grades = ['5c', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7b', '7c'];
                          return grades[value - 1] || value;
                        }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          const grades = ['5c', '6a', '6a+', '6b', '6b+', '6c', '6c+', '7a', '7b', '7c'];
                          return [grades[value - 1] || value, 'Max Grade'];
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gradeValue" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Not enough data for progression chart
                </div>
              )}
            </CardContent>
          </Card>

          {/* Route Type Breakdown */}
          <Card className="bg-white shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Route Type Breakdown
              </h3>
              
              {monthlyStats?.routeTypeBreakdown && monthlyStats.routeTypeBreakdown.length > 0 ? (
                <div>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={monthlyStats.routeTypeBreakdown}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                          label={({ percentage }) => `${percentage}%`}
                          labelLine={false}
                        >
                          {monthlyStats.routeTypeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={routeTypeColors[entry.routeType] || '#8884d8'} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [value, 'Climbs']}
                          labelFormatter={(label) => `Route Type: ${label}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Custom Legend for Mobile */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {monthlyStats.routeTypeBreakdown.map((entry, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: routeTypeColors[entry.routeType] || '#8884d8' }}
                        />
                        <span className="text-gray-700 truncate">
                          {entry.routeType} ({entry.count})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No route type data available
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
