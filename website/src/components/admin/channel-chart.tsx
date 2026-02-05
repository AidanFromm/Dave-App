"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface ChannelChartProps {
  webOrders: number;
  instoreOrders: number;
}

const COLORS = ["#FB4F14", "#007AFF"];

export function ChannelChart({ webOrders, instoreOrders }: ChannelChartProps) {
  const total = webOrders + instoreOrders;
  const data = [
    {
      name: `Web (${total > 0 ? Math.round((webOrders / total) * 100) : 0}%)`,
      value: webOrders,
    },
    {
      name: `In-Store (${total > 0 ? Math.round((instoreOrders / total) * 100) : 0}%)`,
      value: instoreOrders,
    },
  ];

  return (
    <div className="rounded-xl shadow-card bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Sales by Channel</h3>
      {total === 0 ? (
        <div className="flex items-center justify-center h-[250px] text-muted-foreground">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index]}
                  strokeWidth={0}
                />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value: string) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
