import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";

const dailyData = [
  { day: "Mon", requests: 120 }, { day: "Tue", requests: 180 },
  { day: "Wed", requests: 240 }, { day: "Thu", requests: 200 },
  { day: "Fri", requests: 310 }, { day: "Sat", requests: 90 },
  { day: "Sun", requests: 60 },
];

const usageData = [
  { name: "Projects", value: 40 },
  { name: "Team", value: 25 },
  { name: "Storage", value: 20 },
  { name: "API", value: 15 },
];

const COLORS = ["hsl(221, 83%, 53%)", "hsl(262, 83%, 58%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)"];

const monthlyData = [
  { month: "Jan", value: 400 }, { month: "Feb", value: 600 },
  { month: "Mar", value: 800 }, { month: "Apr", value: 1200 },
  { month: "May", value: 1000 }, { month: "Jun", value: 1500 },
];

export default function DashboardAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Insights into your workspace usage</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="font-display text-base">Daily API Requests</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '8px' }} />
                <Bar dataKey="requests" fill="hsl(221, 83%, 53%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display text-base">Resource Usage</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={usageData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {usageData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="font-display text-base">Monthly Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(220, 9%, 46%)', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: 'hsl(0, 0%, 100%)', border: '1px solid hsl(220, 13%, 91%)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="value" stroke="hsl(262, 83%, 58%)" fill="hsl(262, 83%, 58% / 0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
