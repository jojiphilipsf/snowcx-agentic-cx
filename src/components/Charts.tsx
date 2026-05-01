"use client";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { CHART_COLORS } from "@/lib/colors";

const AXIS = { fontSize: 11, fill: "#64748b", fontFamily: "'Inter', sans-serif" };
const GRID = { strokeDasharray: "3 3", stroke: "#1e293b", opacity: 0.6 };
const TT = { contentStyle: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, fontSize: 12, color: "#f1f5f9", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" } };
const AXIS_LINE = { stroke: "#1e293b" };

export function NocBarChart({ data, xKey, yKey, color = CHART_COLORS[0], height = 280 }: { data: Record<string, unknown>[]; xKey: string; yKey: string; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={AXIS_LINE} tickLine={false} />
        <YAxis tick={AXIS} axisLine={AXIS_LINE} tickLine={false} />
        <Tooltip {...TT} cursor={{ fill: "rgba(41,181,232,0.06)" }} />
        <Bar dataKey={yKey} fill={color} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function NocLineChart({ data, xKey, lines, height = 280 }: { data: Record<string, unknown>[]; xKey: string; lines: { key: string; color?: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={AXIS_LINE} tickLine={false} />
        <YAxis tick={AXIS} axisLine={AXIS_LINE} tickLine={false} />
        <Tooltip {...TT} />
        {lines.length > 1 && <Legend />}
        {lines.map((l, i) => (
          <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color || CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: l.color || CHART_COLORS[i % CHART_COLORS.length] }} activeDot={{ r: 5, strokeWidth: 2 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function NocAreaChart({ data, xKey, yKey, color = CHART_COLORS[0], height = 280 }: { data: Record<string, unknown>[]; xKey: string; yKey: string; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={AXIS_LINE} tickLine={false} />
        <YAxis tick={AXIS} axisLine={AXIS_LINE} tickLine={false} />
        <Tooltip {...TT} />
        <Area type="monotone" dataKey={yKey} stroke={color} strokeWidth={2} fill={`url(#grad-${yKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function NocDonutChart({ data, nameKey, valueKey, colorMap, height = 260 }: { data: Record<string, unknown>[]; nameKey: string; valueKey: string; colorMap?: Record<string, string>; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} innerRadius="55%" outerRadius="80%" paddingAngle={3} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={{ stroke: "#475569" }}>
          {data.map((entry, i) => (
            <Cell key={i} fill={colorMap ? colorMap[String(entry[nameKey])] || CHART_COLORS[i % CHART_COLORS.length] : CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip {...TT} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function NocGroupedBar({ data, xKey, bars, height = 280 }: { data: Record<string, unknown>[]; xKey: string; bars: { key: string; color?: string; name?: string }[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={AXIS_LINE} tickLine={false} />
        <YAxis tick={AXIS} axisLine={AXIS_LINE} tickLine={false} />
        <Tooltip {...TT} />
        <Legend />
        {bars.map((b, i) => (
          <Bar key={b.key} dataKey={b.key} name={b.name || b.key} fill={b.color || CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
