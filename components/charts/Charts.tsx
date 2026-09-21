"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { day: string; value: number };

const fmtDay = (d: string) => {
  const [, m, day] = d.split("-");
  return `${Number(day)}/${Number(m)}`;
};

/** Small line/area chart for a 30-day daily series. */
export function DailyAreaChart({ data, color = "#2490eb", label, money }: { data: Point[]; color?: string; label: string; money?: boolean }) {
  const fmt = (v: number) => (money ? `Rs ${v.toLocaleString("en-PK")}` : v.toLocaleString());
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={`g-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#e6e9f1" vertical={false} />
        <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: "#7a8494" }} axisLine={false} tickLine={false} interval={6} />
        <YAxis tick={{ fontSize: 11, fill: "#7a8494" }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(v) => (money && v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
        <Tooltip
          formatter={(v) => [fmt(Number(v)), label]}
          labelFormatter={(d) => String(d)}
          contentStyle={{ borderRadius: 10, border: "1px solid #e6e9f1", fontSize: 12 }}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#g-${label})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({ data }: { data: { name: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: "#3b4a5c" }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #e6e9f1", fontSize: 12 }} />
        <Bar dataKey="value" fill="#2490eb" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
