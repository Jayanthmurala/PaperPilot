import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import {
  TrendingUp, Target, Database, GraduationCap, ChevronRight,
  Activity, MessageSquare, FileCheck, Inbox
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

/* Iris palette — one violet data hue; warm-stone neutrals; status only where good/bad has meaning. */
const DATA = '#6d47c9';
const DATA_TINT = 'rgba(109,71,201,0.07)';
const GRID = '#ece8e2';
const AXIS = '#948c82';
const INK = '#57534e';

function ChartTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-0.5 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">
        {payload[0].value}{unit}
      </p>
    </div>
  );
}

const SectionCard = ({ title, subtitle, right, children, delay = 0, className = '' }) => (
  <div className={`pp-card pp-animate-in p-5 ${className}`} style={{ animationDelay: `${delay}ms` }}>
    <div className="mb-5 flex items-start justify-between">
      <div>
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const Empty = ({ msg = 'No data yet' }) => (
  <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
    <Inbox className="text-muted-foreground/30" size={26} />
    <p className="text-sm text-muted-foreground">{msg}</p>
  </div>
);

const Analytics = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8" data-testid="analytics-loading">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  const subjectData = analytics?.subject_wise_stats
    ? Object.entries(analytics.subject_wise_stats).map(([subject, stats]) => ({
      subject,
      score: stats.avg_score,
      count: stats.count,
    }))
    : [];

  const trendData = analytics?.recent_trends
    ? [...analytics.recent_trends].reverse().map((t, idx) => ({
      name: `Eval ${idx + 1}`,
      score: t.score,
      student: t.student_name
    }))
    : [];

  const similarityPct = (analytics?.avg_similarity || 0) * 100;
  const verifiedPct = (analytics?.feedback_count / (analytics?.total_evaluations || 1)) * 100;
  const ringLen = 439.8;

  const kpis = [
    { label: 'Total Evaluations', value: analytics?.total_evaluations || 0, icon: FileCheck, hint: `${subjectData.length} subjects graded` },
    { label: 'Average Score', value: analytics?.average_score || 0, suffix: '%', decimals: 1, icon: TrendingUp, hint: 'across all evaluations' },
    { label: 'RAG Trust Score', value: similarityPct, suffix: '%', decimals: 1, icon: Database, hint: 'retrieval similarity' },
    { label: 'Model Accuracy', value: analytics?.model_accuracy || 0, suffix: '%', decimals: 1, icon: Target, hint: 'AI vs teacher agreement' },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-8" data-testid="analytics-page">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 pp-animate-in">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap size={19} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Advanced Analytics</h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            In-depth performance data and system metrics
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 active:scale-95"
        >
          <Activity size={16} />
          Refresh Stats
        </button>
      </div>

      {/* KPI row — monochrome */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => <StatCard key={k.label} {...k} index={i} delay={i * 70} />)}
      </div>

      {/* Main grid */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <SectionCard title="Score Trends" subtitle="Recent evaluation scores" delay={300}>
            {trendData.length ? (
              <ResponsiveContainer width="100%" height={340}>
                <AreaChart data={trendData} margin={{ left: -18, right: 8, top: 4, bottom: 4 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={DATA} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={DATA} stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} dy={6} />
                  <YAxis domain={[0, 100]} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <Area type="monotone" dataKey="score" stroke={DATA} strokeWidth={2} fill="url(#colorScore)" dot={false} activeDot={{ r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Empty />}
          </SectionCard>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <SectionCard title="Subject Performance" subtitle="Average score by subject" delay={380}>
              {subjectData.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={subjectData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                    <CartesianGrid horizontal={false} stroke={GRID} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                    <YAxis dataKey="subject" type="category" width={100} tick={{ fill: INK, fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: DATA_TINT }} content={<ChartTooltip unit="%" />} />
                    <Bar dataKey="score" fill={DATA} radius={[0, 4, 4, 0]} barSize={20}
                      label={{ position: 'right', fill: INK, fontSize: 12, formatter: (v) => `${Math.round(v)}%` }} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <Empty />}
            </SectionCard>

            <SectionCard title="RAG Statistics" subtitle="Retrieval health" delay={450}>
              <div className="space-y-8 py-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avg Chunks / Eval</p>
                  <p className="mt-1 text-4xl font-semibold tabular-nums text-foreground">{(analytics?.avg_chunks || 0).toFixed(1)}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>Similarity Ratio</span>
                    <span className="tabular-nums">{similarityPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-1000"
                      style={{ width: `${similarityPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <SectionCard title="Teacher Feedback" subtitle="Human-in-the-loop coverage" delay={520}>
            <div className="flex flex-col items-center py-2">
              <div className="relative h-40 w-40">
                <svg className="h-full w-full -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="transparent" stroke={GRID} strokeWidth="12" />
                  <circle
                    cx="80" cy="80" r="70" fill="transparent" stroke={DATA} strokeWidth="12"
                    strokeDasharray={ringLen}
                    strokeDashoffset={ringLen * (1 - (analytics?.feedback_count / (analytics?.total_evaluations || 1)))}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-semibold tabular-nums text-foreground">{verifiedPct.toFixed(0)}%</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Verified</span>
                </div>
              </div>
              <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">{analytics?.feedback_count} evaluations</span> have been manually verified by faculty members.
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Student Coverage" subtitle="Distinct students evaluated" delay={590}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare size={16} className="text-primary" />
              <span className="text-xs font-medium">Assessment reach</span>
            </div>
            <p className="mt-3 text-5xl font-semibold tabular-nums text-foreground">{analytics?.total_students || 0}</p>
            <p className="mt-1 text-sm text-muted-foreground">Distinct Students Evaluated</p>
            <button className="mt-6 flex items-center gap-1 text-sm font-semibold text-primary transition hover:opacity-80">
              View Detailed Ledger <ChevronRight size={16} />
            </button>
          </SectionCard>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
