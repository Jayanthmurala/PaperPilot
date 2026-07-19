import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API } from '../App';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  Activity, TrendingUp, AlertTriangle, ShieldCheck, Users, Inbox
} from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

/* Iris palette. Accuracy trend = single violet data hue. The predicted-vs-actual
   chart is a genuine 2-series comparison → violet (AI) + amber (teacher). Status
   colors (emerald/amber/rose) encode good/borderline/bad only. */
const DATA = '#6d47c9';   // violet — AI predicted / single data hue
const ACTUAL = '#d9822b'; // amber — teacher actual (2nd series only)
const GRID = '#ece8e2';
const AXIS = '#948c82';
const INK = '#57534e';

function AccTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-0.5 text-xs font-medium text-muted-foreground">Point {label}</p>
      <p className="text-sm font-semibold text-foreground tabular-nums">
        {payload[0].value}{unit}
      </p>
    </div>
  );
}

function SeriesTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-muted-foreground">Point {label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 text-sm font-semibold text-foreground tabular-nums">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {p.value}%
        </p>
      ))}
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

const PageHeader = () => (
  <div className="mb-7 flex flex-wrap items-end justify-between gap-4 pp-animate-in">
    <div>
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Activity size={19} />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Model Performance</h1>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Evaluation accuracy tracking and drift analysis
      </p>
    </div>
  </div>
);

const ModelMonitoring = () => {
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/model/performance`, {
        headers: getAuthHeaders(),
        withCredentials: true
      });
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8" data-testid="model-monitoring-loading">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-muted" />
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />)}
        </div>
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />)}
        </div>
      </div>
    );
  }

  // Handle empty state (No feedback submitted yet)
  if (!performanceData || !performanceData.performance_data || performanceData.performance_data.length === 0) {
    return (
      <div className="min-h-screen bg-background p-6 md:p-8" data-testid="model-monitoring-page">
        <PageHeader />
        <div className="pp-card pp-animate-in flex flex-col items-center justify-center p-12 text-center" style={{ animationDelay: '120ms' }}>
          <div className="mb-6 grid h-20 w-20 place-items-center rounded-full bg-muted">
            <Inbox size={40} className="text-muted-foreground/40" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">No Performance Data Yet</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            The neural engine needs teacher feedback to calculate accuracy.
            Go to the <strong className="font-semibold text-foreground">Reviews</strong> page and provide feedback on evaluations to see performance insights here.
          </p>
        </div>
      </div>
    );
  }

  const currentAccuracy = performanceData?.running_accuracy?.length > 0
    ? performanceData.running_accuracy[performanceData.running_accuracy.length - 1].accuracy
    : 0;

  const avgError = performanceData?.avg_error || 0;

  const kpis = [
    { label: 'System Accuracy', value: currentAccuracy, suffix: '%', decimals: 1, icon: ShieldCheck, hint: 'latest running accuracy' },
    { label: 'Feedback Samples', value: performanceData?.total_feedback || 0, icon: Users, hint: 'teacher-reviewed answers' },
    { label: 'Average Error', value: avgError, decimals: 2, icon: AlertTriangle, hint: 'mean AI vs teacher gap' },
    { label: 'Total Iterations', value: performanceData?.total_evaluations || (performanceData?.performance_data?.length || 0), icon: Activity, hint: 'evaluations processed' },
  ];

  return (
    <div className="min-h-screen bg-background p-6 md:p-8" data-testid="model-monitoring-page">
      <PageHeader />

      {/* KPI row — monochrome */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k, i) => <StatCard key={k.label} {...k} index={i} delay={i * 70} />)}
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Accuracy Evolution"
          subtitle="Running AI-vs-teacher agreement over reviews"
          right={<span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><TrendingUp size={13} className="text-emerald-500" />{currentAccuracy.toFixed(0)}% now</span>}
          delay={300}
        >
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={performanceData.running_accuracy} margin={{ left: -18, right: 8, top: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="accFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={DATA} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={DATA} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="index" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis domain={[0, 100]} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={<AccTooltip unit="%" />} />
              <Area type="monotone" dataKey="accuracy" stroke={DATA} strokeWidth={2} fill="url(#accFill)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>

        <SectionCard
          title="Prediction Alignment"
          subtitle="AI predicted vs teacher actual, per evaluation"
          delay={380}
        >
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={performanceData.performance_data} margin={{ left: -18, right: 8, top: 4, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="index" tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis domain={[0, 100]} tick={{ fill: AXIS, fontSize: 12 }} tickLine={false} axisLine={false} />
              <Tooltip content={<SeriesTooltip />} />
              <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: INK }} />
              <Line type="monotone" dataKey="predicted_score" name="AI predicted" stroke={DATA} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="actual_score" name="Teacher actual" stroke={ACTUAL} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </SectionCard>
      </div>

      {/* Validation log */}
      <div className="pp-card pp-animate-in mt-5 overflow-hidden p-0" style={{ animationDelay: '460ms' }}>
        <div className="border-b border-border p-5">
          <h2 className="text-[15px] font-semibold text-foreground">Validation Log</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Most recent reviewed evaluations</p>
        </div>
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Entry Point</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Score</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Faculty Score</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Error Δ</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {performanceData.performance_data.slice(-8).reverse().map((item, idx) => (
                <tr key={idx} className="transition-colors hover:bg-muted">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-semibold text-muted-foreground">
                        {item.index}
                      </div>
                      <span className="text-muted-foreground">{new Date(item.timestamp).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold tabular-nums text-foreground">{item.predicted_score.toFixed(1)}%</td>
                  <td className="px-6 py-4 font-semibold tabular-nums text-muted-foreground">{item.actual_score.toFixed(1)}%</td>
                  <td className="px-6 py-4">
                    <span className={`rounded px-2 py-1 text-xs font-semibold tabular-nums ${item.error < 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {item.error.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${item.is_correct ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {item.is_correct ? 'Verified' : 'Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ModelMonitoring;
