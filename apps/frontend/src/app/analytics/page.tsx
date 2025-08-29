'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Target,
    Shield,
    AlertTriangle,
    CheckCircle,
    Clock,
    Download,
    Filter,
    Calendar,
    Eye,
    MousePointer,
    Flag
} from 'lucide-react'

interface RiskHeatmapData {
    department: string
    totalUsers: number
    highRisk: number
    mediumRisk: number
    lowRisk: number
    avgScore: number
    trend: 'up' | 'down' | 'stable'
}

interface FunnelData {
    stage: string
    count: number
    percentage: number
    color: string
}

interface LiveEvent {
    id: string
    timestamp: string
    type: 'email_opened' | 'email_clicked' | 'email_reported' | 'training_completed'
    user: string
    campaign: string
    department: string
}

const mockRiskHeatmap: RiskHeatmapData[] = [
    {
        department: 'Finance',
        totalUsers: 75,
        highRisk: 12,
        mediumRisk: 28,
        lowRisk: 35,
        avgScore: 68.5,
        trend: 'down'
    },
    {
        department: 'Sales',
        totalUsers: 150,
        highRisk: 18,
        mediumRisk: 45,
        lowRisk: 87,
        avgScore: 72.3,
        trend: 'up'
    },
    {
        department: 'IT',
        totalUsers: 50,
        highRisk: 2,
        mediumRisk: 15,
        lowRisk: 33,
        avgScore: 85.2,
        trend: 'stable'
    },
    {
        department: 'HR',
        totalUsers: 25,
        highRisk: 1,
        mediumRisk: 8,
        lowRisk: 16,
        avgScore: 81.7,
        trend: 'up'
    },
    {
        department: 'Marketing',
        totalUsers: 100,
        highRisk: 8,
        mediumRisk: 32,
        lowRisk: 60,
        avgScore: 76.8,
        trend: 'stable'
    }
]

const mockFunnelData: FunnelData[] = [
    { stage: 'Emails Sent', count: 2500, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Emails Opened', count: 1875, percentage: 75, color: 'bg-green-500' },
    { stage: 'Links Clicked', count: 312, percentage: 12.5, color: 'bg-yellow-500' },
    { stage: 'Forms Submitted', count: 89, percentage: 3.6, color: 'bg-red-500' },
    { stage: 'Reported as Phishing', count: 156, percentage: 6.2, color: 'bg-purple-500' }
]

const mockLiveEvents: LiveEvent[] = [
    {
        id: '1',
        timestamp: '2024-01-15T14:32:15Z',
        type: 'email_clicked',
        user: 'john.doe@company.com',
        campaign: 'Q1 Security Test',
        department: 'Finance'
    },
    {
        id: '2',
        timestamp: '2024-01-15T14:31:45Z',
        type: 'email_reported',
        user: 'jane.smith@company.com',
        campaign: 'Q1 Security Test',
        department: 'IT'
    },
    {
        id: '3',
        timestamp: '2024-01-15T14:30:22Z',
        type: 'training_completed',
        user: 'bob.wilson@company.com',
        campaign: 'Phishing Awareness',
        department: 'Sales'
    }
]

export default function AnalyticsPage() {
    const [selectedTimeRange, setSelectedTimeRange] = useState('30d')
    const [selectedDepartment, setSelectedDepartment] = useState('all')

    const getRiskColor = (avgScore: number) => {
        if (avgScore >= 80) return 'text-green-600 bg-green-50'
        if (avgScore >= 60) return 'text-yellow-600 bg-yellow-50'
        return 'text-red-600 bg-red-50'
    }

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
            case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
            default: return <div className="h-4 w-4" />
        }
    }

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'email_opened': return <Eye className="h-4 w-4 text-blue-600" />
            case 'email_clicked': return <MousePointer className="h-4 w-4 text-yellow-600" />
            case 'email_reported': return <Flag className="h-4 w-4 text-green-600" />
            case 'training_completed': return <CheckCircle className="h-4 w-4 text-purple-600" />
            default: return <Clock className="h-4 w-4 text-gray-400" />
        }
    }

    const getEventColor = (type: string) => {
        switch (type) {
            case 'email_opened': return 'bg-blue-50 text-blue-800'
            case 'email_clicked': return 'bg-yellow-50 text-yellow-800'
            case 'email_reported': return 'bg-green-50 text-green-800'
            case 'training_completed': return 'bg-purple-50 text-purple-800'
            default: return 'bg-gray-50 text-gray-800'
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Security Analytics</h1>
                    <p className="text-gray-600 mt-2">Risk insights, campaign performance, and real-time monitoring</p>
                </div>
                <div className="flex space-x-4">
                    <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="1y">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                    </Button>
                </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Shield className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">72.5</p>
                                <p className="text-sm text-gray-600">Avg Security Score</p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                                    <span className="text-xs text-green-600">+5.2% vs last month</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold">41</p>
                                <p className="text-sm text-gray-600">High Risk Users</p>
                                <div className="flex items-center mt-1">
                                    <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                                    <span className="text-xs text-green-600">-12 vs last month</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Target className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">12.5%</p>
                                <p className="text-sm text-gray-600">Click Rate</p>
                                <div className="flex items-center mt-1">
                                    <TrendingDown className="h-3 w-3 text-green-600 mr-1" />
                                    <span className="text-xs text-green-600">-3.2% vs last month</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Flag className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">6.2%</p>
                                <p className="text-sm text-gray-600">Report Rate</p>
                                <div className="flex items-center mt-1">
                                    <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                                    <span className="text-xs text-green-600">+1.8% vs last month</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="heatmap" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="heatmap">Risk Heatmap</TabsTrigger>
                    <TabsTrigger value="funnel">Campaign Funnel</TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                    <TabsTrigger value="live">Live Feed</TabsTrigger>
                </TabsList>

                <TabsContent value="heatmap" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Risk Heatmap by Department</CardTitle>
                                    <CardDescription>
                                        Security risk distribution across organizational departments
                                    </CardDescription>
                                </div>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        <SelectItem value="finance">Finance</SelectItem>
                                        <SelectItem value="sales">Sales</SelectItem>
                                        <SelectItem value="it">IT</SelectItem>
                                        <SelectItem value="hr">HR</SelectItem>
                                        <SelectItem value="marketing">Marketing</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockRiskHeatmap.map((dept) => (
                                    <div key={dept.department} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">{dept.department}</h3>
                                                <p className="text-sm text-gray-600">{dept.totalUsers} total users</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge className={getRiskColor(dept.avgScore)}>
                                                    {dept.avgScore.toFixed(1)} avg score
                                                </Badge>
                                                {getTrendIcon(dept.trend)}
                                            </div>
                                        </div>

                                        {/* Risk Distribution Visualization */}
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span>Risk Distribution</span>
                                                <span>{dept.totalUsers} users</span>
                                            </div>
                                            <div className="flex h-4 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-green-500"
                                                    style={{ width: `${(dept.lowRisk / dept.totalUsers) * 100}%` }}
                                                    title={`${dept.lowRisk} low risk users`}
                                                />
                                                <div
                                                    className="bg-yellow-500"
                                                    style={{ width: `${(dept.mediumRisk / dept.totalUsers) * 100}%` }}
                                                    title={`${dept.mediumRisk} medium risk users`}
                                                />
                                                <div
                                                    className="bg-red-500"
                                                    style={{ width: `${(dept.highRisk / dept.totalUsers) * 100}%` }}
                                                    title={`${dept.highRisk} high risk users`}
                                                />
                                            </div>
                                        </div>

                                        {/* Risk Breakdown */}
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div className="text-center">
                                                <div className="font-semibold text-green-600">{dept.lowRisk}</div>
                                                <div className="text-gray-600">Low Risk</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-semibold text-yellow-600">{dept.mediumRisk}</div>
                                                <div className="text-gray-600">Medium Risk</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="font-semibold text-red-600">{dept.highRisk}</div>
                                                <div className="text-gray-600">High Risk</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="funnel" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Funnel Analysis</CardTitle>
                            <CardDescription>
                                User engagement flow through phishing simulation campaigns
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {mockFunnelData.map((stage, index) => (
                                    <div key={stage.stage} className="relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold">{stage.stage}</h3>
                                            <div className="text-right">
                                                <div className="font-bold text-lg">{stage.count.toLocaleString()}</div>
                                                <div className="text-sm text-gray-600">{stage.percentage}%</div>
                                            </div>
                                        </div>

                                        {/* Funnel Bar */}
                                        <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                                            <div
                                                className={`${stage.color} h-full transition-all duration-500 flex items-center justify-center text-white font-semibold`}
                                                style={{ width: `${stage.percentage}%` }}
                                            >
                                                {stage.percentage >= 20 && `${stage.count.toLocaleString()}`}
                                            </div>
                                            {stage.percentage < 20 && (
                                                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-700 font-semibold">
                                                    {stage.count.toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        {/* Conversion Rate */}
                                        {index > 0 && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {((stage.count / mockFunnelData[index - 1].count) * 100).toFixed(1)}% conversion from previous stage
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Funnel Insights */}
                                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                                    <h4 className="font-semibold text-blue-800 mb-2">Key Insights</h4>
                                    <ul className="text-sm text-blue-700 space-y-1">
                                        <li>• 75% email open rate indicates good deliverability</li>
                                        <li>• 12.5% click rate is within expected range for phishing simulations</li>
                                        <li>• 6.2% report rate shows improving security awareness</li>
                                        <li>• 28.5% of users who clicked also submitted forms (high engagement)</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    <TrendsAnalysis />
                </TabsContent>

                <TabsContent value="live" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Live Activity Feed</CardTitle>
                                    <CardDescription>Real-time security events and user interactions</CardDescription>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-gray-600">Live</span>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockLiveEvents.map((event) => (
                                    <div key={event.id} className="flex items-center space-x-4 p-3 border rounded-lg hover:bg-gray-50">
                                        <div className="flex-shrink-0">
                                            {getEventIcon(event.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <Badge className={getEventColor(event.type)} variant="secondary">
                                                    {event.type.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-sm text-gray-600">
                                                    {new Date(event.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium truncate">{event.user}</p>
                                            <p className="text-xs text-gray-600">{event.campaign} • {event.department}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 text-center">
                                <Button variant="outline">
                                    <Clock className="h-4 w-4 mr-2" />
                                    Load More Events
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function TrendsAnalysis() {
    return (
        <div className="space-y-6">
            {/* Trend Charts Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle>Security Metrics Trends</CardTitle>
                    <CardDescription>30-day trend analysis of key security indicators</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Trend charts would be displayed here</p>
                            <p className="text-sm text-gray-400">Integration with charting library needed</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trend Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Click Rate Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-green-600">↓ 3.2%</p>
                                <p className="text-sm text-gray-600">Decreasing (Good)</p>
                            </div>
                            <TrendingDown className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Click rates have decreased by 3.2% over the last 30 days, indicating improved user awareness.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Report Rate Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-green-600">↑ 1.8%</p>
                                <p className="text-sm text-gray-600">Increasing (Good)</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            More users are reporting suspicious emails, showing improved security behavior.
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Training Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-blue-600">↑ 5.4%</p>
                                <p className="text-sm text-gray-600">Increasing</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-blue-600" />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Training completion rates have improved significantly this month.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Predictive Insights */}
            <Card>
                <CardHeader>
                    <CardTitle>Predictive Insights</CardTitle>
                    <CardDescription>AI-powered predictions based on current trends</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <h4 className="font-semibold text-green-800">Positive Trend</h4>
                            <p className="text-sm text-green-700 mt-1">
                                Based on current trends, your organization's overall security posture is expected to improve by 8-12% over the next quarter.
                            </p>
                        </div>

                        <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                            <h4 className="font-semibold text-yellow-800">Watch Area</h4>
                            <p className="text-sm text-yellow-700 mt-1">
                                Finance department shows slower improvement rates. Consider targeted training interventions.
                            </p>
                        </div>

                        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-semibold text-blue-800">Recommendation</h4>
                            <p className="text-sm text-blue-700 mt-1">
                                Maintain current campaign frequency. Users are responding well to the current training cadence.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
