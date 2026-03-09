'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import type { DayStats } from '@/hooks/useScreenData'

export function WeekChart({ days }: { days: DayStats[] }) {
  const data = days.map(d => ({
    name: d.label, earned: d.earned, spent: d.spent, isToday: d.isToday,
  }))
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} barGap={3} barCategoryGap="22%">
        <XAxis dataKey="name"
          tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11, fontFamily: 'Outfit' }}
          axisLine={false} tickLine={false}
        />
        <YAxis hide />
        <Tooltip
          contentStyle={{
            background: 'rgba(15,15,30,0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 14, fontFamily: 'Outfit', fontSize: 12,
          }}
          labelStyle={{ color: '#f0f0ff', fontWeight: 600, marginBottom: 4 }}
          formatter={(value, name) => [`${value ?? 0} min`, name === 'earned' ? '⚡ Gagné' : '📱 Dépensé']}
        />
        <Bar dataKey="earned" radius={[6,6,0,0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.isToday ? '#6ee7b7' : 'rgba(110,231,183,0.3)'} />
          ))}
        </Bar>
        <Bar dataKey="spent" radius={[6,6,0,0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.isToday ? '#ff6b8a' : 'rgba(255,107,138,0.3)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}