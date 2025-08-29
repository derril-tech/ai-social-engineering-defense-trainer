'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Play, Pause, BarChart3, Users, Calendar, Target, Settings, Eye } from 'lucide-react'

interface Campaign {
    id: string
    name: string
    type: 'email' | 'sms' | 'voice' | 'chat' | 'web'
    status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled'
    templateId: string
    templateName: string
    targetCount: number
    sentCount: number
    openedCount: number
    clickedCount: number
    reportedCount: number
    scheduledAt?: string
    startedAt?: string
    completedAt?: string
    createdAt: string
}

const mockCampaigns: Campaign[] = [
    {
        id: '1',
        name: 'Q1 Security Awareness - Email',
        type: 'email',
        status: 'running',
        templateId: '1',
        templateName: 'Urgent Security Update',
        targetCount: 500,
        sentCount: 500,
        openedCount: 245,
        clickedCount: 67,
        reportedCount: 23,
        scheduledAt: '2024-01-15T09:00:00Z',
        startedAt: '2024-01-15T09:00:00Z',
        createdAt: '2024-01-10T14:30:00Z'
    },
    {
        id: '2',
        name: 'Mobile Security Training - SMS',
        type: 'sms',
        status: 'scheduled',
        templateId: '2',
        templateName: 'Prize Winner SMS',
        targetCount: 200,
        sentCount: 0,
        openedCount: 0,
        clickedCount: 0,
        reportedCount: 0,
        scheduledAt: '2024-01-20T10:00:00Z',
        createdAt: '2024-01-12T11:15:00Z'
    },
    {
        id: '3',
        name: 'Executive Phishing Test',
        type: 'email',
        status: 'completed',
        templateId: '3',
        templateName: 'Board Meeting Urgent',
        targetCount: 25,
        sentCount: 25,
        openedCount: 22,
        clickedCount: 8,
        reportedCount: 14,
        scheduledAt: '2024-01-05T08:00:00Z',
        startedAt: '2024-01-05T08:00:00Z',
        completedAt: '2024-01-05T17:00:00Z',
        createdAt: '2024-01-02T16:00:00Z'
    }
]

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
    const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
    const [isCreating, setIsCreating] = useState(false)

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800'
            case 'scheduled': return 'bg-blue-100 text-blue-800'
            case 'running': return 'bg-green-100 text-green-800'
            case 'paused': return 'bg-yellow-100 text-yellow-800'
            case 'completed': return 'bg-purple-100 text-purple-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'email': return '📧'
            case 'sms': return '📱'
            case 'voice': return '📞'
            case 'chat': return '💬'
            case 'web': return '🌐'
            default: return '📄'
        }
    }

    const calculateClickRate = (campaign: Campaign) => {
        return campaign.sentCount > 0 ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1) : '0.0'
    }

    const calculateReportRate = (campaign: Campaign) => {
        return campaign.sentCount > 0 ? ((campaign.reportedCount / campaign.sentCount) * 100).toFixed(1) : '0.0'
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Campaign Management</h1>
                    <p className="text-gray-600 mt-2">Create, manage, and monitor phishing simulation campaigns</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                </Button>
            </div>

            <Tabs defaultValue="active" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="active">Active Campaigns</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.filter(c => c.status === 'running' || c.status === 'paused').map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} onView={setSelectedCampaign} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="scheduled" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.filter(c => c.status === 'scheduled' || c.status === 'draft').map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} onView={setSelectedCampaign} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="completed" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {campaigns.filter(c => c.status === 'completed' || c.status === 'cancelled').map((campaign) => (
                            <CampaignCard key={campaign.id} campaign={campaign} onView={setSelectedCampaign} />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <CampaignAnalytics campaigns={campaigns} />
                </TabsContent>
            </Tabs>

            {/* Campaign Creation Modal */}
            {isCreating && (
                <CampaignCreationModal onClose={() => setIsCreating(false)} />
            )}

            {/* Campaign Details Modal */}
            {selectedCampaign && (
                <CampaignDetailsModal
                    campaign={selectedCampaign}
                    onClose={() => setSelectedCampaign(null)}
                />
            )}
        </div>
    )
}

function CampaignCard({ campaign, onView }: { campaign: Campaign; onView: (campaign: Campaign) => void }) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-100 text-gray-800'
            case 'scheduled': return 'bg-blue-100 text-blue-800'
            case 'running': return 'bg-green-100 text-green-800'
            case 'paused': return 'bg-yellow-100 text-yellow-800'
            case 'completed': return 'bg-purple-100 text-purple-800'
            case 'cancelled': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'email': return '📧'
            case 'sms': return '📱'
            case 'voice': return '📞'
            case 'chat': return '💬'
            case 'web': return '🌐'
            default: return '📄'
        }
    }

    const calculateClickRate = (campaign: Campaign) => {
        return campaign.sentCount > 0 ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1) : '0.0'
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
                        <div>
                            <CardTitle className="text-lg">{campaign.name}</CardTitle>
                            <CardDescription className="text-sm">{campaign.templateName}</CardDescription>
                        </div>
                    </div>
                    <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Progress Bar */}
                    {campaign.status === 'running' && (
                        <div>
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{campaign.sentCount}/{campaign.targetCount}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(campaign.sentCount / campaign.targetCount) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-gray-600">Targets</div>
                            <div className="font-semibold">{campaign.targetCount}</div>
                        </div>
                        <div>
                            <div className="text-gray-600">Sent</div>
                            <div className="font-semibold">{campaign.sentCount}</div>
                        </div>
                        <div>
                            <div className="text-gray-600">Clicked</div>
                            <div className="font-semibold text-red-600">{campaign.clickedCount} ({calculateClickRate(campaign)}%)</div>
                        </div>
                        <div>
                            <div className="text-gray-600">Reported</div>
                            <div className="font-semibold text-green-600">{campaign.reportedCount}</div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                        <Button size="sm" variant="outline" onClick={() => onView(campaign)}>
                            <Eye className="h-3 w-3 mr-1" />
                            View
                        </Button>
                        {campaign.status === 'running' && (
                            <Button size="sm" variant="outline">
                                <Pause className="h-3 w-3 mr-1" />
                                Pause
                            </Button>
                        )}
                        {campaign.status === 'scheduled' && (
                            <Button size="sm" variant="outline">
                                <Play className="h-3 w-3 mr-1" />
                                Start
                            </Button>
                        )}
                        <Button size="sm" variant="outline">
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function CampaignAnalytics({ campaigns }: { campaigns: Campaign[] }) {
    const totalCampaigns = campaigns.length
    const activeCampaigns = campaigns.filter(c => c.status === 'running').length
    const completedCampaigns = campaigns.filter(c => c.status === 'completed').length

    const totalSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0)
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clickedCount, 0)
    const totalReported = campaigns.reduce((sum, c) => sum + c.reportedCount, 0)

    const overallClickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : '0.0'
    const overallReportRate = totalSent > 0 ? ((totalReported / totalSent) * 100).toFixed(1) : '0.0'

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Target className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{totalCampaigns}</p>
                                <p className="text-sm text-gray-600">Total Campaigns</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Play className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{activeCampaigns}</p>
                                <p className="text-sm text-gray-600">Active Campaigns</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Users className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">{totalSent.toLocaleString()}</p>
                                <p className="text-sm text-gray-600">Total Sent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <BarChart3 className="h-8 w-8 text-red-600" />
                            <div>
                                <p className="text-2xl font-bold">{overallClickRate}%</p>
                                <p className="text-sm text-gray-600">Click Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                    <CardDescription>Overall metrics across all campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Click Rate (Lower is Better)</span>
                            <span className="text-sm text-red-600 font-semibold">{overallClickRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: `${Math.min(parseFloat(overallClickRate), 100)}%` }}
                            ></div>
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Report Rate (Higher is Better)</span>
                            <span className="text-sm text-green-600 font-semibold">{overallReportRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${Math.min(parseFloat(overallReportRate), 100)}%` }}
                            ></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Campaigns */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Campaign Results</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {campaigns.slice(0, 5).map((campaign) => (
                            <div key={campaign.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <span className="text-lg">{getTypeIcon(campaign.type)}</span>
                                    <div>
                                        <p className="font-medium">{campaign.name}</p>
                                        <p className="text-sm text-gray-600">{campaign.templateName}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">
                                        {campaign.clickedCount}/{campaign.sentCount} clicked
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {campaign.reportedCount} reported
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function CampaignCreationModal({ onClose }: { onClose: () => void }) {
    const [campaignData, setCampaignData] = useState({
        name: '',
        type: 'email',
        templateId: '',
        targetGroups: [],
        scheduledAt: '',
        description: ''
    })

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Create New Campaign</CardTitle>
                            <CardDescription>Set up a new phishing simulation campaign</CardDescription>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            ✕
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="campaign-name">Campaign Name</Label>
                            <Input
                                id="campaign-name"
                                placeholder="Enter campaign name..."
                                value={campaignData.name}
                                onChange={(e) => setCampaignData({ ...campaignData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label htmlFor="campaign-type">Campaign Type</Label>
                            <Select value={campaignData.type} onValueChange={(value) => setCampaignData({ ...campaignData, type: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">📧 Email Phishing</SelectItem>
                                    <SelectItem value="sms">📱 SMS Phishing</SelectItem>
                                    <SelectItem value="voice">📞 Voice Phishing</SelectItem>
                                    <SelectItem value="chat">💬 Chat Phishing</SelectItem>
                                    <SelectItem value="web">🌐 Web Phishing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="template-select">Select Template</Label>
                        <Select value={campaignData.templateId} onValueChange={(value) => setCampaignData({ ...campaignData, templateId: value })}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose a template..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Urgent Security Update</SelectItem>
                                <SelectItem value="2">Prize Winner SMS</SelectItem>
                                <SelectItem value="3">Board Meeting Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="target-groups">Target Groups</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select target groups..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all-employees">All Employees</SelectItem>
                                <SelectItem value="executives">Executives</SelectItem>
                                <SelectItem value="it-staff">IT Staff</SelectItem>
                                <SelectItem value="finance">Finance Team</SelectItem>
                                <SelectItem value="hr">HR Team</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="scheduled-at">Schedule Date & Time</Label>
                        <Input
                            id="scheduled-at"
                            type="datetime-local"
                            value={campaignData.scheduledAt}
                            onChange={(e) => setCampaignData({ ...campaignData, scheduledAt: e.target.value })}
                        />
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Calendar className="h-4 w-4 mr-2" />
                            Schedule Campaign
                        </Button>
                        <Button variant="outline">
                            Save as Draft
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function CampaignDetailsModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
                                <span>{campaign.name}</span>
                            </CardTitle>
                            <CardDescription>{campaign.templateName}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            ✕
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Status and Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{campaign.targetCount}</p>
                                        <p className="text-sm text-gray-600">Target Recipients</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold">{campaign.sentCount}</p>
                                        <p className="text-sm text-gray-600">Messages Sent</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-600">{campaign.clickedCount}</p>
                                        <p className="text-sm text-gray-600">Clicked Links</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Performance Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span>Click Rate</span>
                                        <span className="font-semibold text-red-600">
                                            {calculateClickRate(campaign)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Report Rate</span>
                                        <span className="font-semibold text-green-600">
                                            {calculateReportRate(campaign)}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Open Rate</span>
                                        <span className="font-semibold">
                                            {campaign.sentCount > 0 ? ((campaign.openedCount / campaign.sentCount) * 100).toFixed(1) : '0.0'}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Campaign Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Created:</span>
                                        <span className="text-sm">{new Date(campaign.createdAt).toLocaleString()}</span>
                                    </div>
                                    {campaign.scheduledAt && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Scheduled:</span>
                                            <span className="text-sm">{new Date(campaign.scheduledAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {campaign.startedAt && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Started:</span>
                                            <span className="text-sm">{new Date(campaign.startedAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                    {campaign.completedAt && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Completed:</span>
                                            <span className="text-sm">{new Date(campaign.completedAt).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'email': return '📧'
        case 'sms': return '📱'
        case 'voice': return '📞'
        case 'chat': return '💬'
        case 'web': return '🌐'
        default: return '📄'
    }
}

function calculateClickRate(campaign: Campaign) {
    return campaign.sentCount > 0 ? ((campaign.clickedCount / campaign.sentCount) * 100).toFixed(1) : '0.0'
}

function calculateReportRate(campaign: Campaign) {
    return campaign.sentCount > 0 ? ((campaign.reportedCount / campaign.sentCount) * 100).toFixed(1) : '0.0'
}
