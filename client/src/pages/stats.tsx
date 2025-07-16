import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mountain, TrendingUp, Target } from "lucide-react";

export default function Stats() {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(7);

  const { data: monthlyStats } = useQuery({
    queryKey: ["/api/stats/monthly", selectedYear, selectedMonth],
    queryFn: () => 
      fetch(`/api/stats/monthly?year=${selectedYear}&month=${selectedMonth}`)
        .then(res => res.json())
  });

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const formatMonthValue = (year: number, month: number) => {
    const monthName = monthNames[month - 1];
    return `${monthName.slice(0, 3)} ${year}`;
  };

  return (
    <div className="py-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Stats</h2>
      
      {/* Month Selector */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Select Month
        </Label>
        <Select
          value={`${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`}
          onValueChange={(value) => {
            const [year, month] = value.split('-');
            setSelectedYear(parseInt(year));
            setSelectedMonth(parseInt(month));
          }}
        >
          <SelectTrigger className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {[2025, 2024, 2023].map(year => 
              Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <SelectItem key={`${year}-${month}`} value={`${year}-${month.toString().padStart(2, '0')}`}>
                  {formatMonthValue(year, month)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Mountain className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">Max Grade</div>
            <div className="text-2xl font-bold text-gray-900">
              {monthlyStats?.maxGrade || '5a'}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">Total Climbs</div>
            <div className="text-2xl font-bold text-gray-900">
              {monthlyStats?.totalClimbs || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm border border-gray-100">
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {monthlyStats?.successRate || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Section */}
      <Card className="bg-white shadow-sm border border-gray-100">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Average Rank by Month
          </h3>
          
          {/* Simple chart visualization */}
          <div className="relative h-48 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg mb-4">
            <div className="absolute bottom-0 left-0 w-full h-3/4 bg-gradient-to-t from-blue-600 to-blue-400 rounded-lg opacity-80"></div>
            <div className="absolute inset-0 flex items-end justify-between px-4 pb-2">
              <div className="text-xs text-gray-600">Jul 25</div>
              <div className="text-xs text-gray-600">Jun 25</div>
            </div>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm">
            <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
            <span className="text-gray-600">Avg Rank Rounded</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
