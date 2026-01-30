
import React, { useMemo, useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { analyticsAPI } from "../lib/api";
import { Loader } from "lucide-react";

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
  <div className="flex flex-col rounded-2xl border p-4 shadow-md bg-gradient-to-b from-sky-50 to-sky-100">
    <span className="text-xs font-medium text-slate-500">{label}</span>
    <span className="mt-1 text-2xl font-bold text-slate-900">{value}</span>
    {hint && <span className="mt-1 text-xs text-slate-500">{hint}</span>}
  </div>
);

const Pill: React.FC<{children: React.ReactNode}> = ({children}) => (
  <span className="rounded-full border px-3 py-1 text-xs text-slate-600">{children}</span>
);

const Insights: React.FC = () => {
  const [range, setRange] = useState("90d");
  const [contentType, setContentType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for real data
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  // Fetch analytics data when range or content type changes
  useEffect(() => {
    fetchAnalytics();
  }, [range, contentType]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await analyticsAPI.getInsights({
        range,
        contentType
      });
      const data = response.data?.data || response.data;
      setAnalyticsData(data);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.response?.data?.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from real data
  const stats = useMemo(() => {
    if (!analyticsData) return { publishRate: 0, totalViews: 0, totalPosts: 0, tweetQueueCount: 0 };
    return analyticsData.stats || {};
  }, [analyticsData]);

  const cadence = analyticsData?.cadence || [];
  const tags = analyticsData?.tags || [];
  const engagement = analyticsData?.engagement || [];
  const latency = analyticsData?.latency || [];
  const costs = analyticsData?.costs || [];
  const staleDrafts = analyticsData?.staleDrafts || [];
  const qualityIssues = analyticsData?.qualityIssues || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-sky-cta animate-spin mx-auto" />
          <p className="mt-4 text-muted-blue">جاري تحميل البيانات التحليلية...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-red-800 font-semibold">خطأ في تحميل البيانات</p>
          <p className="text-red-700 text-sm mt-1">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            إعادة المحاولة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">التحليلات والمؤشرات</h1>
          <p className="mt-1 text-sm text-slate-600">لوحة مؤشرات المدوّنة - بيانات حقيقية من قاعدة البيانات</p>
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
          </select>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="متوسط النشر / شهر" value={stats.publishRate || 0} hint="Cadence of new articles" />
        <Stat label="الزيارات (الفترة)" value={(stats.totalViews || 0).toLocaleString()} hint="مجموع زيارات الصفحات" />
        <Stat label="المقالات (الفترة)" value={stats.totalPosts || 0} hint="تم إنشاؤها في الفترة المحددة" />
        <Stat label="قائمة انتظار التغريدات" value={stats.tweetQueueCount || 0} hint="بانتظار النشر" />
      </div>

      <Section title="وتيرة النشر" subtitle="عدد المقالات شهريًا">
        {cadence.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <p>لا توجد بيانات في الفترة المحددة</p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <BarChart data={cadence}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="posts" fill="#0ea5e9" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Pill>الهدف: ≥ 8 مقالات/شهر</Pill>
          <Pill>المالك: Editorial</Pill>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Section title="مسار التفاعل" subtitle="الزيارات → القراءات → المشتركين">
          {engagement.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <p>لا توجد بيانات متاحة</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={engagement}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" strokeWidth={2} stroke="#0ea5e9" />
                  <Line type="monotone" dataKey="reads" strokeWidth={2} stroke="#0369a1" />
                  <Line type="monotone" dataKey="subs" strokeWidth={2} stroke="#38bdf8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="توازن الوسوم / التصنيفات" subtitle="توازن الموضوعات">
          {tags.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              <p>لا توجد وسوم متاحة</p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={tags} dataKey="value" nameKey="name" outerRadius={100} innerRadius={50} paddingAngle={2}>
                    {tags.map((_, idx) => (<Cell key={idx} fill="#0ea5e9" />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Section title="زمن الاستجابة p95 للواجهات" subtitle="صحة الخلفية (Backend)">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <AreaChart data={latency}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="p95" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#g1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-500 text-center">
            بيانات تقديرية - سيتم ربطها بـ CloudWatch لاحقاً
          </div>
        </Section>

        <Section title="توزيع التكلفة" subtitle="تقسيم الكلفة">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={costs} dataKey="value" nameKey="name" outerRadius={110}>
                  {costs.map((_, i) => <Cell key={i} fill="#0ea5e9" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-slate-500 text-center">
            بيانات تقديرية - سيتم ربطها بـ AWS Cost Explorer لاحقاً
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Section title="المسودات المتقادمة" subtitle="المسودات غير المنشورة (> 7 أيام)">
          <div className="overflow-hidden rounded-xl border">
            {staleDrafts.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>لا توجد مسودات متقادمة 🎉</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="p-3">العنوان</th>
                    <th className="p-3">المالك</th>
                    <th className="p-3">العمر (أيام)</th>
                  </tr>
                </thead>
                <tbody>
                  {staleDrafts.map((d: any) => (
                    <tr key={d.id} className="border-t">
                      <td className="p-3">{d.title}</td>
                      <td className="p-3">{d.owner}</td>
                      <td className="p-3">{d.age}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Section>

        <Section title="مشاكل الجودة" subtitle="روابط مكسورة/صور كبيرة/Alt مفقود">
          <div className="overflow-hidden rounded-xl border">
            {qualityIssues.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <p>لا توجد مشاكل جودة مكتشفة 🎉</p>
                <p className="text-xs mt-2">سيتم إضافة فحص الروابط والصور قريباً</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="p-3">العنصر</th>
                    <th className="p-3">المشكلة</th>
                    <th className="p-3">العدد</th>
                  </tr>
                </thead>
                <tbody>
                  {qualityIssues.map((b: any, idx: number) => (
                    <tr key={idx} className="border-t">
                      <td className="p-3 font-mono text-xs">{b.url}</td>
                      <td className="p-3">{b.issue}</td>
                      <td className="p-3">{b.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
};

export default Insights;
