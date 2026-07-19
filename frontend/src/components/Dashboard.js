import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import {
  TrendingUp, Users, FileCheck, Target, MessageSquareText,
  GraduationCap, Inbox, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  AreaChart, Area,
} from 'recharts';
import { StatCard } from '@/components/ui/stat-card';

/* Disciplined palette ("Iris"):
   - DATA: one violet hue for every chart mark — the category is named on the axis,
     so color is not asked to encode it again.
   - STATUS: green / amber / rose, used only where good/bad has real meaning.
   - Everything else is warm-stone neutral; violet (brand) is reserved for chrome. */
const DATA = '#6d47c9';        // violet — validated single data hue
const DATA_TINT = 'rgba(109,71,201,0.07)';
const GRID = '#ece8e2';        // warm hairline
const AXIS = '#948c82';        // warm muted
const INK = '#57534e';         // warm stone ink

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const gradeOf = (s) => (s >= 90 ? 'A' : s >= 75 ? 'B' : s >= 60 ? 'C' : s >= 40 ? 'D' : 'F');
// status tint, not decoration: pass / borderline / fail
const gradeTint = (g) =>
  g === 'A' || g === 'B'
    ? 'bg-emerald-50 text-emerald-700'
    : g === 'C'
    ? 'bg-amber-50 text-amber-700'
    : 'bg-rose-50 text-rose-700';

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

const Dashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [perf, setPerf] = useState(null);
  const [evals, setEvals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cfg = { headers: getAuthHeaders(), withCredentials: true };
        const [a, p, e] = await Promise.all([
          axios.get(`${API}/analytics`, cfg),
          axios.get(`${API}/model/performance`, cfg).catch(() => ({ data: null })),
          axios.get(`${API}/evaluations`, cfg).catch(() => ({ data: [] })),
        ]);
        setAnalytics(a.data);
        setPerf(p.data);
        setEvals(Array.isArray(e.data) ? e.data : []);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8" data-testid="dashboard-loading">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  const a = analytics || {};
  const subjectData = Object.entries(a.subject_wise_stats || {})
    .map(([subject, s]) => ({ subject, score: Math.round(s.avg_score * 10) / 10 }))
    .sort((x, y) => y.score - x.score);

  const accuracyData = (perf?.running_accuracy || []).map((r) => ({
    x: r.index, accuracy: Math.round(r.accuracy * 10) / 10,
  }));

  const gradeCounts = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  evals.forEach((e) => { gradeCounts[gradeOf(e.score)] += 1; });
  const gradeData = Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count }));

  const kpis = [
    { label: 'Average Score', value: a.average_score || 0, suffix: '%', decimals: 1, icon: TrendingUp, hint: `across ${a.total_evaluations || 0} evaluations` },
    { label: 'Model Accuracy', value: a.model_accuracy || 0, suffix: '%', decimals: 1, icon: Target, hint: 'AI vs teacher agreement' },
    { label: 'Evaluations', value: a.total_evaluations || 0, icon: FileCheck, hint: `${subjectData.length} subjects graded` },
    { label: 'Students Assessed', value: a.total_students || 0, icon: Users, hint: 'unique students' },
    { label: 'Teacher-Reviewed', value: a.feedback_count || 0, icon: MessageSquareText, hint: perf ? `avg error ±${(perf.avg_error || 0).toFixed(1)} pts` : 'human-in-the-loop' },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-8" data-testid="dashboard">
      {/* Header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4 pp-animate-in">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <GraduationCap size={19} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground" data-testid="dashboard-title">
              Faculty Dashboard
            </h1>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            AI-assisted evaluation overview — performance, accuracy &amp; review activity
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </div>
      </div>

      {/* KPI row — uniform, monochrome */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((k, i) => <StatCard key={k.label} {...k} index={i} delay={i * 70} />)}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard title="Subject Performance" subtitle="Average score by subject" delay={380} className="lg:col-span-2">
          {subjectData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={subjectData} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke={GRID} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis type="category" dataKey="subject" width={132} tick={{ fill: INK, fontSize: 13 }} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: DATA_TINT }} content={<ChartTooltip unit="%" />} />
                <Bar dataKey="score" fill={DATA} radius={[0, 4, 4, 0]} barSize={20}
                  label={{ position: 'right', fill: INK, fontSize: 12, formatter: (v) => `${v}%` }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </SectionCard>

        <SectionCard title="Grade Distribution" subtitle={`${evals.length} graded answers`} delay={450}>
          {evals.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={gradeData} margin={{ left: -18, right: 8, top: 8, bottom: 4 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="grade" tick={{ fill: INK, fontSize: 13, fontWeight: 600 }} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: DATA_TINT }} content={<ChartTooltip />} />
                <Bar dataKey="count" fill={DATA} radius={[4, 4, 0, 0]} barSize={30}
                  label={{ position: 'top', fill: INK, fontSize: 12 }} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty />}
        </SectionCard>
      </div>

      {/* Bottom row */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <SectionCard
          title="Model Accuracy Trend"
          subtitle="Running AI-vs-teacher agreement over reviews"
          right={perf ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Activity size={13} className="text-emerald-500" />{(a.model_accuracy || 0).toFixed(0)}% now
            </span>
          ) : null}
          delay={520}
          className="lg:col-span-2"
        >
          {accuracyData.length ? (
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={accuracyData} margin={{ left: -18, right: 8, top: 4, bottom: 4 }}>
                <defs>
                  <linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={DATA} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={DATA} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis dataKey="x" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
                <YAxis domain={[0, 100]} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip unit="%" />} />
                <Area type="monotone" dataKey="accuracy" stroke={DATA} strokeWidth={2} fill="url(#accFill)" dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty msg="Add teacher feedback to build this trend" />}
        </SectionCard>

        <SectionCard title="Recent Evaluations" subtitle="Latest graded scripts" delay={590}>
          {a.recent_trends?.length ? (
            <div className="-mr-1 max-h-[230px] space-y-0.5 overflow-y-auto pr-1">
              {a.recent_trends.map((t, i) => {
                const g = gradeOf(t.score);
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl px-2.5 py-2 transition-colors hover:bg-muted">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${gradeTint(g)}`}>
                        {g}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{t.student_name}</p>
                        <p className="truncate text-xs text-muted-foreground">{t.subject}</p>
                      </div>
                    </div>
                    <span className="ml-2 shrink-0 text-sm font-semibold tabular-nums text-foreground">{t.score}%</span>
                  </div>
                );
              })}
            </div>
          ) : <Empty />}
        </SectionCard>
      </div>
    </div>
  );
};

export default Dashboard;
