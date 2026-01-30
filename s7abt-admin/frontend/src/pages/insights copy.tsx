
import React, { useMemo, useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const Section: React.FC<{title: string; subtitle?: string; right?: React.ReactNode}> = ({ title, subtitle, right, children }) => (
  <section className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">
    <div className="mb-4 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

const Stat: React.FC<{label: string; value: string | number; hint?: string}> = ({ label, value, hint }) => (
  <div className="flex flex-col rounded-2xl border p-4 shadow-xs">
    <span className="text-xs font-medium text-slate-500">{label}</span>
    <span className="mt-1 text-2xl font-bold text-slate-900">{value}</span>
    {hint && <span className="mt-1 text-xs text-slate-500">{hint}</span>}
  </div>
);

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const cadence = months.map((m, i) => ({ month: m, posts: Math.round(6 + (i%4)*2 + (i*0.7)%3) }));
const tags = [
  { name: "AWS", value: 38 },
  { name: "Serverless", value: 22 },
  { name: "Cloud Security", value: 14 },
  { name: "DevOps", value: 18 },
  { name: "Data/AI", value: 8 },
];
const engagement = months.map((m, i) => ({ month: m, views: 800 + i*60, reads: 540 + i*45, subs: 60 + i*6 }));
const latency = Array.from({ length: 14 }).map((_, i) => ({ day: `D${i+1}`, p95: Math.round(240 + Math.sin(i)*30) }));
const costs = [
  { name: "Lambda", value: 18 },
  { name: "API GW", value: 12 },
  { name: "S3+CF", value: 9 },
  { name: "RDS", value: 28 },
  { name: "OpenSearch", value: 15 },
  { name: "Misc", value: 6 },
];
const drafts = [
  { id: 101, title: "دليل شامل لخدمة Amazon S3", age: 21, owner: "Admin User" },
  { id: 102, title: "أفضل الممارسات AWS Lambda", age: 8, owner: "Admin User" },
  { id: 103, title: "Serverless vs Containers", age: 37, owner: "Editor" },
];
const broken = [
  { url: "/post/aws-lambda-guide", issue: "404 to external ref", count: 6 },
  { url: "/post/cloudfront-caching", issue: "Image missing alt", count: 12 },
];

const Pill: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span className="rounded-full border px-3 py-1 text-xs text-slate-600">{children}</span>
);

const Insights: React.FC = () => {
  const [range, setRange] = useState("90d");
  const [contentType, setContentType] = useState("all");

  const totalPosts = useMemo(() => cadence.reduce((a,b)=>a+b.posts,0), []);
  const totalViews = useMemo(() => engagement.reduce((a,b)=>a+b.views,0), []);
  const publishRate = useMemo(() => (cadence.reduce((a,b)=>a+b.posts,0)/cadence.length).toFixed(1), []);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights & Analytics</h1>
          <p className="mt-1 text-sm text-slate-600">لوحة مؤشرات أولية للمدوّنة (بيانات تجريبية قابلة للاستبدال).</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="rounded-xl border px-3 py-2 text-sm" value={range} onChange={e=>setRange(e.target.value)}>
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
            <option value="12m">آخر 12 شهر</option>
          </select>
          <select className="rounded-xl border px-3 py-2 text-sm" value={contentType} onChange={e=>setContentType(e.target.value)}>
            <option value="all">الكل</option>
            <option value="posts">مقالات</option>
            <option value="news">أخبار</option>
            <option value="tags">وسوم</option>
          </select>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Avg. Publish / month" value={`${publishRate}`} hint="Cadence of new articles" />
        <Stat label="Views (period)" value={totalViews.toLocaleString()} hint="Sum of page views" />
        <Stat label="Articles (period)" value={totalPosts} hint="Created in selected window" />
        <Stat label="Tweet Queue" value={42} hint="Awaiting approval" />
      </div>

      <Section title="Publishing Cadence" subtitle="عدد المقالات شهريًا">
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={cadence}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="posts" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill>Goal: ≥ 8 posts/month</Pill>
          <Pill>Owner: Editorial</Pill>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Section title="Engagement Funnel" subtitle="الزيارات → القراءات → المشتركين">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={engagement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="views" strokeWidth={2} />
                <Line type="monotone" dataKey="reads" strokeWidth={2} />
                <Line type="monotone" dataKey="subs" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Tag / Category Mix" subtitle="توازن الموضوعات">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={tags} dataKey="value" nameKey="name" outerRadius={100} innerRadius={50} paddingAngle={2}>
                  {tags.map((_, idx) => (<Cell key={idx} />))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Section title="API p95 Latency" subtitle="صحة الـBackend">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={latency}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#000" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="p95" strokeWidth={2} fillOpacity={1} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Cost Breakdown" subtitle="تقسيم الكلفة">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={costs} dataKey="value" nameKey="name" outerRadius={110}>
                  {costs.map((_, i) => <Cell key={i} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Section title="Aging Drafts" subtitle="المسودات المتقادمة (أيام)">
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Owner</th>
                  <th className="p-3">Age (days)</th>
                </tr>
              </thead>
              <tbody>
                {drafts.map((d) => (
                  <tr key={d.id} className="border-t">
                    <td className="p-3">{d.title}</td>
                    <td className="p-3">{d.owner}</td>
                    <td className="p-3">{d.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Quality Issues" subtitle="روابط مكسورة/صور كبيرة/Alt مفقود">
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3">Issue</th>
                  <th className="p-3">Count</th>
                </tr>
              </thead>
              <tbody>
                {broken.map((b, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-3 font-mono text-xs">{b.url}</td>
                    <td className="p-3">{b.issue}</td>
                    <td className="p-3">{b.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default Insights;
