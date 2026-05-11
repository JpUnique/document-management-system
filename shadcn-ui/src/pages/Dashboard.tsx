import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useDocuments } from '@/context/DocumentContext';
import { useActivity } from '@/context/ActivityContext';
import { Document } from '@/types/document';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  FilePlus,
  Clock,
  Star,
  FileText,
  FolderClosed,
  Users,
  AlertCircle,
  Activity as ActivityIcon,
  TrendingUp,
  Upload,
  Eye,
  Edit,
  Share2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Document card component for recent/starred documents
const DocumentCard: React.FC<{ doc: Document }> = ({ doc }) => {
  const fileTypeIcons: Record<string, React.ReactNode> = {
    'pdf': <FileText className="h-10 w-10 text-red-500" />,
    'doc': <FileText className="h-10 w-10 text-blue-500" />,
    'docx': <FileText className="h-10 w-10 text-blue-500" />,
    'xls': <FileText className="h-10 w-10 text-green-500" />,
    'xlsx': <FileText className="h-10 w-10 text-green-500" />,
    'ppt': <FileText className="h-10 w-10 text-orange-500" />,
    'pptx': <FileText className="h-10 w-10 text-orange-500" />,
    'txt': <FileText className="h-10 w-10 text-gray-500" />,
    'default': <FileText className="h-10 w-10 text-gray-500" />
  };

  const icon = fileTypeIcons[doc.type] || fileTypeIcons.default;
  const formattedDate = new Date(doc.uploadDate).toLocaleDateString();

  return (
    <Link to={`/documents/${doc.id}`} className="block">
      <div className="flex items-center p-3 rounded-lg hover:bg-accent/50 transition-colors">
        {icon}
        <div className="ml-4 flex-1 min-w-0">
          <p className="font-medium text-sm">{doc.name}</p>
          <p className="text-xs text-muted-foreground">
            {formattedDate} • {(doc.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        {doc.status === 'processing' && (
          <div className="ml-2 flex items-center">
            <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
          </div>
        )}
      </div>
    </Link>
  );
};

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { documents, folders } = useDocuments();
  const { activities, getActivityStats, getRecentActivities } = useActivity();
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalFolders: 0,
    documentsThisWeek: 0,
    processing: 0
  });

  // Calculate statistics
  useEffect(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    setStats({
      totalDocuments: documents.length,
      totalFolders: folders.length - 1, // Excluding root folder
      documentsThisWeek: documents.filter(
        doc => new Date(doc.uploadDate) >= oneWeekAgo
      ).length,
      processing: documents.filter(doc => doc.status === 'processing').length
    });
  }, [documents, folders]);

  // Get recent and starred documents
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 5);
    
  const starredDocuments = documents.filter(doc => doc.starred).slice(0, 5);

  // Get activity data for charts - recalculate when activities change
  const weeklyStats = useMemo(() => getActivityStats(7), [activities, getActivityStats]);
  const recentActivities = useMemo(() => getRecentActivities(10), [activities, getRecentActivities]);

  // Prepare chart data - use T12:00:00 to avoid timezone day-shift issues
  const activityChartData = weeklyStats.map(stat => ({
    date: new Date(stat.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    Uploads: stat.uploads,
    Edits: stat.edits,
    Views: stat.views,
    Shares: stat.shares
  }));

  const totalActivityData = weeklyStats.map(stat => ({
    date: new Date(stat.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    Total: stat.total
  }));

  // Calculate activity type distribution
  const activityTypeData = [
    { name: 'Uploads', value: weeklyStats.reduce((sum, stat) => sum + stat.uploads, 0), color: '#3b82f6' },
    { name: 'Edits', value: weeklyStats.reduce((sum, stat) => sum + stat.edits, 0), color: '#10b981' },
    { name: 'Views', value: weeklyStats.reduce((sum, stat) => sum + stat.views, 0), color: '#f59e0b' },
    { name: 'Shares', value: weeklyStats.reduce((sum, stat) => sum + stat.shares, 0), color: '#8b5cf6' }
  ].filter(item => item.value > 0);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="h-4 w-4 text-blue-500" />;
      case 'edit': return <Edit className="h-4 w-4 text-green-500" />;
      case 'view': return <Eye className="h-4 w-4 text-amber-500" />;
      case 'share': return <Share2 className="h-4 w-4 text-purple-500" />;
      default: return <ActivityIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'upload': return 'text-blue-600';
      case 'edit': return 'text-green-600';
      case 'view': return 'text-amber-600';
      case 'share': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name}</h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your document management system
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link to="/documents/new" className="flex items-center gap-2">
              <FilePlus className="h-4 w-4" />
              Upload New Document
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              View All Documents
            </Link>
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.documentsThisWeek} new this week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Folders</CardTitle>
              <FolderClosed className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFolders}</div>
              <p className="text-xs text-muted-foreground">
                Organized file structure
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {weeklyStats.reduce((sum, stat) => sum + stat.total, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total actions this week
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.processing}</div>
              <p className="text-xs text-muted-foreground">
                Documents being processed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Activity Charts */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Activity Overview
            </TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Recent Documents
            </TabsTrigger>
            <TabsTrigger value="starred" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Starred Documents
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* Bar Chart - Activity by Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Activity by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityChartData.some(d => d.Uploads + d.Edits + d.Views + d.Shares > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={activityChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Uploads" fill="#3b82f6" />
                        <Bar dataKey="Edits" fill="#10b981" />
                        <Bar dataKey="Views" fill="#f59e0b" />
                        <Bar dataKey="Shares" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
                      <div>
                        <BarChart3 className="h-10 w-10 mx-auto mb-2" />
                        <p>No activity data yet</p>
                        <p className="text-sm">Upload and work with documents to see activity</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Line Chart - Total Activity Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  {totalActivityData.some(d => d.Total > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={totalActivityData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
                      <div>
                        <TrendingUp className="h-10 w-10 mx-auto mb-2" />
                        <p>No trend data yet</p>
                        <p className="text-sm">Activity will be tracked automatically</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Distribution and Recent Activity */}
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {/* Pie Chart - Activity Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Activity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {activityTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={activityTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {activityTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-center text-muted-foreground">
                      <div>
                        <ActivityIcon className="h-10 w-10 mx-auto mb-2" />
                        <p>No activity distribution yet</p>
                        <p className="text-sm">Start working with documents</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity Feed */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {recentActivities.length > 0 ? (
                      <div className="space-y-3">
                        {recentActivities.map(activity => (
                          <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50">
                            <div className="mt-1">{getActivityIcon(activity.type)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                <span className={getActivityColor(activity.type)}>
                                  {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                </span>
                                {' '}- {activity.documentName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                by {activity.userName} • {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center text-muted-foreground">
                        <div>
                          <Clock className="h-10 w-10 mx-auto mb-2" />
                          <p>No recent activity</p>
                          <p className="text-sm">Activity will appear here automatically</p>
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recent" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px]">
                  {recentDocuments.length > 0 ? (
                    <div className="space-y-1">
                      {recentDocuments.map(doc => (
                        <DocumentCard key={doc.id} doc={doc} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[250px] text-center">
                      <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No recent documents</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Upload a document to see it here
                      </p>
                      <Button className="mt-4" asChild>
                        <Link to="/documents/new">Upload Document</Link>
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="starred" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Starred Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[320px]">
                  {starredDocuments.length > 0 ? (
                    <div className="space-y-1">
                      {starredDocuments.map(doc => (
                        <DocumentCard key={doc.id} doc={doc} />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[250px] text-center">
                      <Star className="h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="text-lg font-medium">No starred documents</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Star important documents to access them quickly
                      </p>
                      <Button className="mt-4" variant="outline" asChild>
                        <Link to="/documents">View All Documents</Link>
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Dashboard;