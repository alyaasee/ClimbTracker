import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, TrendingUp, Target, Calendar } from "lucide-react";

export default function Stats() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data: availableMonths = [] } = useQuery({
    queryKey: ["api", "stats", "available-months"],
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ["api", "stats", "monthly", selectedYear, selectedMonth],
  });

  const { data: gradeProgression = [] } = useQuery({
    queryKey: ["api", "stats", "grade-progression", selectedYear, selectedMonth],
  });

  const COLORS = ['#CEE4D2', '#EF7326', '#B96BFF', '#2F9BFF', '#50E29F'];

  const formatMonth = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  return (
    <div className="py-4 space-y-4">
      {/* Header */}
      <div className="retro-container-primary p-4">
        <h1 className="retro-title text-xl text-center">Climbing Stats</h1>
      </div>

      {/* Month Selector */}
      <div className="retro-container p-4">
        <div className="retro-label mb-3">Select Month</div>
        <Select
          value={`${selectedYear}-${selectedMonth}`}
          onValueChange={(value) => {
            const [year, month] = value.split('-').map(Number);
            setSelectedYear(year);
            setSelectedMonth(month);
          }}
        >
          <SelectTrigger className="retro-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="retro-container">
            {availableMonths.map((month: any) => (
              <SelectItem 
                key={`${month.year}-${month.month}`} 
                value={`${month.year}-${month.month}`}
                className="retro-body"
              >
                {month.monthName} {month.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {monthlyStats && (
        <>
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="retro-container-accent p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-climb-orange" strokeWidth={3} />
              <div className="retro-title text-2xl mb-1">{monthlyStats.totalClimbs}</div>
              <div className="retro-label">Total Climbs</div>
            </div>

            <div className="retro-container-accent p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-climb-blue" strokeWidth={3} />
              <div className="retro-title text-2xl mb-1">{monthlyStats.maxGrade}</div>
              <div className="retro-label">Max Grade</div>
            </div>

            <div className="retro-container-accent p-4 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-climb-green" strokeWidth={3} />
              <div className="retro-title text-2xl mb-1">{monthlyStats.successRate}%</div>
              <div className="retro-label">Success Rate</div>
            </div>

            <div className="retro-container-accent p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-climb-purple" strokeWidth={3} />
              <div className="retro-title text-lg mb-1">{formatMonth(selectedYear, selectedMonth).split(' ')[0]}</div>
              <div className="retro-label">Selected</div>
            </div>
          </div>

          {/* Route Type Breakdown */}
          {monthlyStats.routeTypeBreakdown.length > 0 && (
            <div className="retro-container p-4">
              <h3 className="retro-heading text-lg mb-4">Route Type Breakdown</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyStats.routeTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      stroke="#1F1F1F"
                      strokeWidth={3}
                    >
                      {monthlyStats.routeTypeBreakdown.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#FCFCF9',
                        border: '3px solid #1F1F1F',
                        borderRadius: '8px',
                        fontFamily: 'Space Mono, monospace',
                        fontWeight: '600'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{
                        fontFamily: 'Space Mono, monospace',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* Grade Progression */}
      {gradeProgression.length > 0 && (
        <div className="retro-container p-4">
          <h3 className="retro-heading text-lg mb-4">Grade Progression</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gradeProgression}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#9BA0A5"
                  strokeWidth={2}
                />
                <XAxis 
                  dataKey="month" 
                  stroke="#1F1F1F"
                  strokeWidth={2}
                  style={{ 
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                />
                <YAxis 
                  stroke="#1F1F1F"
                  strokeWidth={2}
                  style={{ 
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FCFCF9',
                    border: '3px solid #1F1F1F',
                    borderRadius: '8px',
                    fontFamily: 'Space Mono, monospace',
                    fontWeight: '600'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="gradeValue" 
                  stroke="#EF7326" 
                  strokeWidth={4}
                  strokeLinecap="round"
                  dot={{ 
                    fill: '#EF7326', 
                    strokeWidth: 3, 
                    stroke: '#1F1F1F', 
                    r: 6 
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!monthlyStats && (
        <div className="retro-container p-8 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-climb-gray" />
          <div className="retro-body text-climb-gray">
            No climbing data available for the selected month
          </div>
        </div>
      )}
    </div>
  );
}