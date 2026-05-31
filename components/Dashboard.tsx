"use client";

import { useAppStore } from '../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Calendar, Clock, MessageSquare, Users, Link as LinkIcon, FileImage } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

export function Dashboard() {
  const { stats, messages, reset } = useAppStore();

  if (!stats) return null;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const hourlyData = Object.entries(stats.messagesByHour).map(([hour, count]) => {
    const h = parseInt(hour);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return {
      hour: `${displayHour} ${suffix}`,
      messages: count,
      hourNum: h,
    };
  }).sort((a, b) => a.hourNum - b.hourNum);

  const weekdayData = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => ({
    day,
    messages: stats.messagesByWeekday[day] || 0,
  }));
  
  const participationData = Object.values(stats.participants)
    .sort((a, b) => b.totalMessages - a.totalMessages)
    .slice(0, 10).map((p, index) => ({
      name: p.name,
      messages: p.totalMessages,
      fill: COLORS[index % COLORS.length]
    }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chat Analytics</h2>
          <p className="text-muted-foreground mt-1">
            {messages.length.toLocaleString()} messages analyzed across {stats.totalParticipants} participants
          </p>
        </div>
        <button 
          onClick={reset}
          className="text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 rounded-md transition-colors cursor-pointer"
        >
          Analyze Another File
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Messages"
          value={stats.totalMessages.toLocaleString()}
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          description="Total messages exchanged"
        />
        <MetricCard
          title="Active Days"
          value={stats.totalDurationDays.toLocaleString()}
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
          description={`${stats.avgMessagesPerDay.toFixed(1)} msgs/day on average`}
        />
        <MetricCard
          title="Media Shared"
          value={stats.totalMediaMessages.toLocaleString()}
          icon={<FileImage className="h-4 w-4 text-muted-foreground" />}
          description="Photos, videos, and documents"
        />
        <MetricCard
          title="Top Sender"
          value={stats.mostActiveParticipant?.split(' ')[0] || 'N/A'}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          description="Most active participant"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="participants">Participants</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Activity by Time of Day</CardTitle>
                <CardDescription>When are you most active?</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'var(--accent)' }} contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }} />
                    <Bar dataKey="messages" fill="var(--color-primary, #3b82f6)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Participation Share</CardTitle>
                <CardDescription>Messages per participant</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={participationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="messages"
                    >
                      {participationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity by Weekday</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" axisLine={false} tickLine={false} />
                    <YAxis dataKey="day" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} width={80} />
                    <Tooltip cursor={{ fill: 'var(--accent)' }} contentStyle={{ borderRadius: '8px', backgroundColor: 'var(--card)', color: 'var(--foreground)', borderColor: 'var(--border)' }} />
                    <Bar dataKey="messages" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Top Emojis</CardTitle>
                <CardDescription>Most frequently used emojis globally</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] w-full pr-4">
                  <div className="flex flex-wrap gap-3">
                    {stats.topEmojis.slice(0, 50).map((emoji, i) => (
                      <div key={i} className="flex items-center gap-1.5 p-2 rounded-lg bg-muted text-lg border border-border">
                        <span>{emoji.emoji}</span>
                        <span className="text-xs text-muted-foreground font-mono">{emoji.count}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="participants">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.values(stats.participants)
                .sort((a,b) => b.totalMessages - a.totalMessages)
                .map(p => (
                <Card key={p.name}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{p.name}</CardTitle>
                    <CardDescription>{p.totalMessages.toLocaleString()} msgs ({(p.totalMessages / stats.totalMessages * 100).toFixed(1)}%)</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Words</span>
                            <div className="font-medium text-sm">{p.totalWords.toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Media</span>
                            <div className="font-medium text-sm">{p.totalMedia.toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Links</span>
                            <div className="font-medium text-sm">{p.totalLinks.toLocaleString()}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs text-muted-foreground">Words/Msg</span>
                            <div className="font-medium text-sm">{(p.totalWords / Math.max(1, p.totalMessages)).toFixed(1)}</div>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: { title: string, value: string | number, icon: React.ReactNode, description: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
