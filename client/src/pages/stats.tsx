import { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Mountain, Gamepad2, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Stats() {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const { data: availableMonths = [] } = useQuery({
    queryKey: ["api", "stats", "available-months", user?.id],
    enabled: !!user?.id,
  });

  const { data: monthlyStats } = useQuery({
    queryKey: ["api", "stats", "monthly", user?.id, selectedYear, selectedMonth],
    enabled: !!user?.id && selectedMonth !== null,
  });

  const { data: gradeProgression = [] } = useQuery({
    queryKey: ["api", "stats", "grade-progression", user?.id, selectedYear, selectedMonth],
    enabled: !!user?.id && selectedMonth !== null,
  });

  // Color palette from PRD
  const ROUTE_COLORS = {
    'Boulder': '#CEE4D2',
    'Top Rope': '#EF7326', 
    'Lead': '#B96BFF',
    'Auto Belay': '#2F9BFF'
  };

  const formatMonth = (year: number, month: number) => {
    return new Date(year, month - 1).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short' 
    });
  };

  // Climbing grade scale (highest to lowest)
  const GRADE_SCALE = ['7c', '7b', '7a', '6c+', '6c', '6b+', '6b', '6a+', '6a', '5c'];
  
  // Convert grade to numeric value for chart (higher numeric = higher grade)
  const gradeToValue = (grade: string) => {
    const index = GRADE_SCALE.indexOf(grade);
    return index !== -1 ? GRADE_SCALE.length - index : 0;
  };

  // Convert numeric value back to grade for display
  const valueToGrade = (value: number) => {
    const index = GRADE_SCALE.length - value;
    return GRADE_SCALE[index] || '';
  };

  return (
    <div className="py-4 space-y-4 pb-24">
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
            {(availableMonths as any[]).map((month: any) => (
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

      {monthlyStats ? (
        <>
          {/* Summary Tiles - 3 tiles in one row as per PRD */}
          <div className="retro-container p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="retro-container-accent p-4 text-center">
                <Mountain className="w-8 h-8 mx-auto mb-2" style={{color: '#2F9BFF'}} strokeWidth={3} />
                <div className="retro-title text-xl mb-1">{(monthlyStats as any)?.totalClimbs || 0}</div>
                <div className="retro-label text-xs">CLIMBS</div>
              </div>

              <div className="retro-container-accent p-4 text-center">
                <Gamepad2 className="w-8 h-8 mx-auto mb-2" style={{color: '#EF7326'}} strokeWidth={3} />
                <div className="retro-title text-xl mb-1">{(monthlyStats as any)?.maxGrade || '--'}</div>
                <div className="retro-label text-xs">LEVEL</div>
              </div>

              <div className="retro-container-accent p-4 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2" style={{color: '#B96BFF'}} strokeWidth={3} />
                <div className="retro-title text-xl mb-1">{(monthlyStats as any)?.successRate || 0}%</div>
                <div className="retro-label text-xs">SUCCESS</div>
              </div>
            </div>
          </div>

          {/* Grade Progression Chart */}
          {(gradeProgression as any[]).length > 0 && (
            <div className="retro-container p-4">
              <h3 className="retro-heading text-lg mb-4">Grade Progression</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gradeProgression as any[]}>
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
                        fontSize: '10px'
                      }}
                    />
                    <YAxis 
                      stroke="#1F1F1F"
                      strokeWidth={2}
                      style={{ 
                        fontFamily: 'Space Mono, monospace',
                        fontWeight: '600',
                        fontSize: '10px'
                      }}
                      domain={[1, GRADE_SCALE.length]}
                      tickCount={GRADE_SCALE.length}
                      tickFormatter={valueToGrade}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#FCFCF9',
                        border: '3px solid #1F1F1F',
                        borderRadius: '8px',
                        fontFamily: 'Space Mono, monospace',
                        fontWeight: '600'
                      }}
                      formatter={(value: any, name: any) => [valueToGrade(value), 'Grade']}
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
                        r: 5 
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Route Type Breakdown */}
          {(monthlyStats as any)?.routeTypeBreakdown && (monthlyStats as any)?.routeTypeBreakdown.length > 0 && (
            <div className="retro-container p-4">
              <h3 className="retro-heading text-lg mb-4">Route Type Breakdown</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(monthlyStats as any)?.routeTypeBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="count"
                      stroke="#1F1F1F"
                      strokeWidth={3}
                    >
                      {((monthlyStats as any)?.routeTypeBreakdown || []).map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={ROUTE_COLORS[entry.routeType as keyof typeof ROUTE_COLORS] || '#9BA0A5'} 
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
                      formatter={(value: any, name: any, props: any) => [
                        `${value} (${Math.round((props.payload.count / ((monthlyStats as any)?.totalClimbs || 1)) * 100)}%)`,
                        props.payload.routeType
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {((monthlyStats as any)?.routeTypeBreakdown || []).map((entry: any, index: number) => (
                  <div key={entry.routeType} className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2 border-2 border-black"
                      style={{ backgroundColor: ROUTE_COLORS[entry.routeType as keyof typeof ROUTE_COLORS] || '#9BA0A5' }}
                    />
                    <span className="retro-body text-xs">
                      {entry.routeType} ({entry.count})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="retro-container p-8 text-center">
          <Mountain className="w-12 h-12 mx-auto mb-4" style={{color: '#9BA0A5'}} />
          <div className="retro-body" style={{color: '#9BA0A5'}}>
            No climbs yet—get on the wall!
          </div>
        </div>
      )}
    </div>
  );
}