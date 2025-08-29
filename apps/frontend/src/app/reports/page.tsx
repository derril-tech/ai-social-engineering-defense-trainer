'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import {
    FileText,
    Download,
    Calendar,
    Users,
    BarChart3,
    Shield,
    Target,
    Mail,
    Clock,
    CheckCircle,
    Settings,
    Eye,
    Share,
    Filter
} from 'lucide-react'

interface ReportTemplate {
    id: string
    name: string
    description: string
    type: 'executive' | 'compliance' | 'technical' | 'board'
    format: string[]
    estimatedTime: number
    sections: string[]
    audience: string
    frequency: string
}

interface ScheduledReport {
    id: string
    name: string
    template: string
    schedule: string
    lastRun: string
    nextRun: string
    status: 'active' | 'paused' | 'error'
    recipients: string[]
}

const reportTemplates: ReportTemplate[] = [
    {
        id: '1',
        name: 'Executive Security Summary',
        description: 'High-level overview of security awareness program performance',
        type: 'executive',
        format: ['PDF', 'PowerPoint'],
        estimatedTime: 5,
        sections: ['Key Metrics', 'Risk Overview', 'Recommendations', 'ROI Analysis'],
        audience: 'C-Suite, VPs',
        frequency: 'Monthly'
    },
    {
        id: '2',
        name: 'Board Security Report',
        description: 'Comprehensive security posture report for board meetings',
        type: 'board',
        format: ['PDF', 'PowerPoint'],
        estimatedTime: 10,
        sections: ['Executive Summary', 'Program Metrics', 'Risk Trends', 'Compliance Status', 'Strategic Recommendations'],
        audience: 'Board of Directors',
        frequency: 'Quarterly'
    },
    {
        id: '3',
        name: 'Compliance Audit Report',
        description: 'Detailed compliance status and audit trail documentation',
        type: 'compliance',
        format: ['PDF', 'Excel', 'CSV'],
        estimatedTime: 15,
        sections: ['Training Completion', 'Policy Compliance', 'Incident Metrics', 'Audit Trail', 'Certification Status'],
        audience: 'Compliance Team, Auditors',
        frequency: 'Quarterly'
    },
    {
        id: '4',
        name: 'Campaign Performance Analysis',
        description: 'Detailed analysis of phishing simulation campaign results',
        type: 'technical',
        format: ['PDF', 'Excel', 'JSON'],
        estimatedTime: 8,
        sections: ['Campaign Overview', 'Engagement Metrics', 'User Performance', 'Learning Outcomes', 'Technical Details'],
        audience: 'Security Team, IT Managers',
        frequency: 'After Each Campaign'
    },
    {
        id: '5',
        name: 'Department Risk Assessment',
        description: 'Risk analysis and recommendations by department',
        type: 'technical',
        format: ['PDF', 'Excel'],
        estimatedTime: 12,
        sections: ['Risk Heatmap', 'Department Breakdown', 'Trend Analysis', 'Training Recommendations', 'Action Items'],
        audience: 'Department Managers, HR',
        frequency: 'Monthly'
    }
]

const scheduledReports: ScheduledReport[] = [
    {
        id: '1',
        name: 'Monthly Executive Summary',
        template: 'Executive Security Summary',
        schedule: 'Monthly on 1st',
        lastRun: '2024-01-01T09:00:00Z',
        nextRun: '2024-02-01T09:00:00Z',
        status: 'active',
        recipients: ['ceo@company.com', 'ciso@company.com']
    },
    {
        id: '2',
        name: 'Quarterly Board Report',
        template: 'Board Security Report',
        schedule: 'Quarterly',
        lastRun: '2024-01-01T08:00:00Z',
        nextRun: '2024-04-01T08:00:00Z',
        status: 'active',
        recipients: ['board@company.com']
    }
]

export default function ReportsPage() {
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [reportConfig, setReportConfig] = useState({
        dateRange: 'last_30_days',
        departments: [] as string[],
        includeDetails: true,
        format: 'pdf',
        delivery: 'download'
    })

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'executive': return 'bg-purple-100 text-purple-800'
            case 'board': return 'bg-blue-100 text-blue-800'
            case 'compliance': return 'bg-green-100 text-green-800'
            case 'technical': return 'bg-orange-100 text-orange-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800'
            case 'paused': return 'bg-yellow-100 text-yellow-800'
            case 'error': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const handleGenerateReport = async () => {
        if (!selectedTemplate) return

        setIsGenerating(true)
        // Simulate report generation
        setTimeout(() => {
            setIsGenerating(false)
            // In real implementation, this would trigger the export worker
        }, 3000)
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Report Wizard</h1>
                    <p className="text-gray-600 mt-2">Generate executive-friendly reports and compliance documentation</p>
                </div>
                <div className="flex space-x-4">
                    <Button variant="outline">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Report
                    </Button>
                    <Button>
                        <FileText className="h-4 w-4 mr-2" />
                        Quick Report
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="templates" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="templates">Report Templates</TabsTrigger>
                    <TabsTrigger value="generator">Report Generator</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
                    <TabsTrigger value="history">Report History</TabsTrigger>
                </TabsList>

                <TabsContent value="templates" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {reportTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTemplate(template)}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                            <CardDescription className="text-sm">{template.description}</CardDescription>
                                        </div>
                                        <Badge className={getTypeColor(template.type)}>
                                            {template.type}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center space-x-1">
                                                <Clock className="h-4 w-4 text-gray-400" />
                                                <span>{template.estimatedTime} min</span>
                                            </div>
                                            <div className="flex space-x-1">
                                                {template.format.map((fmt) => (
                                                    <Badge key={fmt} variant="outline" className="text-xs">
                                                        {fmt}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-sm font-medium mb-2">Sections:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {template.sections.slice(0, 3).map((section) => (
                                                    <Badge key={section} variant="secondary" className="text-xs">
                                                        {section}
                                                    </Badge>
                                                ))}
                                                {template.sections.length > 3 && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        +{template.sections.length - 3} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-600">
                                            <p><strong>Audience:</strong> {template.audience}</p>
                                            <p><strong>Frequency:</strong> {template.frequency}</p>
                                        </div>

                                        <div className="flex space-x-2 pt-2">
                                            <Button size="sm" className="flex-1">
                                                <FileText className="h-3 w-3 mr-1" />
                                                Generate
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Eye className="h-3 w-3 mr-1" />
                                                Preview
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="generator" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Configuration Panel */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Report Configuration</CardTitle>
                                    <CardDescription>Customize your report parameters</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <Label htmlFor="template-select">Report Template</Label>
                                        <Select value={selectedTemplate?.id || ''} onValueChange={(value) => {
                                            const template = reportTemplates.find(t => t.id === value)
                                            setSelectedTemplate(template || null)
                                        }}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a template..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {reportTemplates.map((template) => (
                                                    <SelectItem key={template.id} value={template.id}>
                                                        {template.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="date-range">Date Range</Label>
                                        <Select value={reportConfig.dateRange} onValueChange={(value) =>
                                            setReportConfig({ ...reportConfig, dateRange: value })
                                        }>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="last_7_days">Last 7 days</SelectItem>
                                                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                                                <SelectItem value="last_90_days">Last 90 days</SelectItem>
                                                <SelectItem value="last_year">Last year</SelectItem>
                                                <SelectItem value="custom">Custom range</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Departments</Label>
                                        <div className="space-y-2 mt-2">
                                            {['All Departments', 'Finance', 'Sales', 'IT', 'HR', 'Marketing'].map((dept) => (
                                                <div key={dept} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={dept}
                                                        checked={dept === 'All Departments' ? reportConfig.departments.length === 0 : reportConfig.departments.includes(dept)}
                                                        onCheckedChange={(checked) => {
                                                            if (dept === 'All Departments') {
                                                                setReportConfig({ ...reportConfig, departments: checked ? [] : ['Finance', 'Sales', 'IT', 'HR', 'Marketing'] })
                                                            } else {
                                                                const newDepts = checked
                                                                    ? [...reportConfig.departments, dept]
                                                                    : reportConfig.departments.filter(d => d !== dept)
                                                                setReportConfig({ ...reportConfig, departments: newDepts })
                                                            }
                                                        }}
                                                    />
                                                    <Label htmlFor={dept} className="text-sm">{dept}</Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="format">Output Format</Label>
                                        <Select value={reportConfig.format} onValueChange={(value) =>
                                            setReportConfig({ ...reportConfig, format: value })
                                        }>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="pdf">PDF Document</SelectItem>
                                                <SelectItem value="pptx">PowerPoint</SelectItem>
                                                <SelectItem value="excel">Excel Workbook</SelectItem>
                                                <SelectItem value="csv">CSV Data</SelectItem>
                                                <SelectItem value="json">JSON Data</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label htmlFor="delivery">Delivery Method</Label>
                                        <Select value={reportConfig.delivery} onValueChange={(value) =>
                                            setReportConfig({ ...reportConfig, delivery: value })
                                        }>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="download">Direct Download</SelectItem>
                                                <SelectItem value="email">Email Delivery</SelectItem>
                                                <SelectItem value="s3">Cloud Storage</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="include-details"
                                            checked={reportConfig.includeDetails}
                                            onCheckedChange={(checked) =>
                                                setReportConfig({ ...reportConfig, includeDetails: !!checked })
                                            }
                                        />
                                        <Label htmlFor="include-details" className="text-sm">Include detailed data</Label>
                                    </div>

                                    <Button
                                        className="w-full"
                                        onClick={handleGenerateReport}
                                        disabled={!selectedTemplate || isGenerating}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-4 w-4 mr-2" />
                                                Generate Report
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Preview Panel */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Report Preview</CardTitle>
                                    <CardDescription>
                                        {selectedTemplate ? `Preview of ${selectedTemplate.name}` : 'Select a template to see preview'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {selectedTemplate ? (
                                        <ReportPreview template={selectedTemplate} config={reportConfig} />
                                    ) : (
                                        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                                            <div className="text-center">
                                                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                                <p className="text-gray-500">Select a report template to see preview</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="scheduled" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Scheduled Reports</CardTitle>
                                    <CardDescription>Automated report generation and delivery</CardDescription>
                                </div>
                                <Button>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    New Schedule
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {scheduledReports.map((report) => (
                                    <div key={report.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">{report.name}</h3>
                                                <p className="text-sm text-gray-600">{report.template}</p>
                                            </div>
                                            <Badge className={getStatusColor(report.status)}>
                                                {report.status}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="font-medium">Schedule</p>
                                                <p className="text-gray-600">{report.schedule}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium">Last Run</p>
                                                <p className="text-gray-600">{new Date(report.lastRun).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium">Next Run</p>
                                                <p className="text-gray-600">{new Date(report.nextRun).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <p className="font-medium text-sm mb-2">Recipients</p>
                                            <div className="flex flex-wrap gap-2">
                                                {report.recipients.map((recipient) => (
                                                    <Badge key={recipient} variant="outline" className="text-xs">
                                                        {recipient}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex space-x-2 mt-4">
                                            <Button size="sm" variant="outline">
                                                <Settings className="h-3 w-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Download className="h-3 w-3 mr-1" />
                                                Run Now
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                {report.status === 'active' ? 'Pause' : 'Resume'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <ReportHistory />
                </TabsContent>
            </Tabs>

            {/* Template Detail Modal */}
            {selectedTemplate && (
                <TemplateDetailModal
                    template={selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                />
            )}
        </div>
    )
}

function ReportPreview({ template, config }: { template: ReportTemplate; config: any }) {
    return (
        <div className="space-y-6">
            {/* Report Header */}
            <div className="border-b pb-4">
                <h2 className="text-2xl font-bold">{template.name}</h2>
                <p className="text-gray-600 mt-1">{template.description}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span>Format: {config.format.toUpperCase()}</span>
                    <span>Date Range: {config.dateRange.replace('_', ' ')}</span>
                    <span>Departments: {config.departments.length === 0 ? 'All' : config.departments.length}</span>
                </div>
            </div>

            {/* Mock Report Content */}
            <div className="space-y-6">
                {template.sections.map((section, index) => (
                    <div key={section} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-3">{section}</h3>

                        {section === 'Key Metrics' && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">72.5</div>
                                    <div className="text-sm text-gray-600">Avg Security Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-red-600">41</div>
                                    <div className="text-sm text-gray-600">High Risk Users</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">12.5%</div>
                                    <div className="text-sm text-gray-600">Click Rate</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">6.2%</div>
                                    <div className="text-sm text-gray-600">Report Rate</div>
                                </div>
                            </div>
                        )}

                        {section === 'Risk Overview' && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span>Overall Risk Level</span>
                                    <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                                </div>
                                <p className="text-sm text-gray-600">
                                    Risk levels have improved by 15% over the last quarter due to increased training completion rates.
                                </p>
                            </div>
                        )}

                        {section === 'Recommendations' && (
                            <ul className="space-y-2">
                                <li className="flex items-start space-x-2">
                                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <span className="text-sm">Implement targeted training for Finance department</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <span className="text-sm">Increase phishing simulation frequency for high-risk users</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <Target className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <span className="text-sm">Review and update security awareness content</span>
                                </li>
                            </ul>
                        )}

                        {index === template.sections.length - 1 && (
                            <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
                                This is a preview. The actual report will contain detailed data, charts, and comprehensive analysis.
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function ReportHistory() {
    const historyItems = [
        {
            id: '1',
            name: 'Executive Security Summary - January 2024',
            template: 'Executive Security Summary',
            generatedAt: '2024-01-15T10:00:00Z',
            format: 'PDF',
            size: '2.3 MB',
            downloadCount: 5,
            status: 'completed'
        },
        {
            id: '2',
            name: 'Board Security Report - Q4 2023',
            template: 'Board Security Report',
            generatedAt: '2024-01-01T09:00:00Z',
            format: 'PowerPoint',
            size: '5.7 MB',
            downloadCount: 12,
            status: 'completed'
        },
        {
            id: '3',
            name: 'Campaign Analysis - December 2023',
            template: 'Campaign Performance Analysis',
            generatedAt: '2023-12-31T16:00:00Z',
            format: 'Excel',
            size: '1.8 MB',
            downloadCount: 3,
            status: 'completed'
        }
    ]

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Report History</CardTitle>
                        <CardDescription>Previously generated reports and downloads</CardDescription>
                    </div>
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {historyItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-4">
                                <FileText className="h-8 w-8 text-blue-600" />
                                <div>
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <p className="text-sm text-gray-600">{item.template}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                        <span>{new Date(item.generatedAt).toLocaleDateString()}</span>
                                        <span>{item.format}</span>
                                        <span>{item.size}</span>
                                        <span>{item.downloadCount} downloads</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Badge className="bg-green-100 text-green-800">
                                    {item.status}
                                </Badge>
                                <Button size="sm" variant="outline">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                </Button>
                                <Button size="sm" variant="outline">
                                    <Share className="h-3 w-3 mr-1" />
                                    Share
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

function TemplateDetailModal({ template, onClose }: { template: ReportTemplate; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">{template.name}</CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            ✕
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Template Details */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">Type</h4>
                                <Badge className={getTypeColor(template.type)}>
                                    {template.type}
                                </Badge>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Estimated Time</h4>
                                <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{template.estimatedTime} minutes</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Audience</h4>
                                <span className="text-sm">{template.audience}</span>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Frequency</h4>
                                <span className="text-sm">{template.frequency}</span>
                            </div>
                        </div>

                        {/* Available Formats */}
                        <div>
                            <h4 className="font-semibold mb-2">Available Formats</h4>
                            <div className="flex space-x-2">
                                {template.format.map((fmt) => (
                                    <Badge key={fmt} variant="outline">
                                        {fmt}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Sections */}
                        <div>
                            <h4 className="font-semibold mb-2">Report Sections</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {template.sections.map((section, index) => (
                                    <div key={section} className="flex items-center space-x-2">
                                        <span className="text-sm font-mono text-gray-500">{index + 1}.</span>
                                        <span className="text-sm">{section}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-4 pt-4">
                            <Button className="flex-1">
                                <FileText className="h-4 w-4 mr-2" />
                                Generate Report
                            </Button>
                            <Button variant="outline">
                                <Calendar className="h-4 w-4 mr-2" />
                                Schedule
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function getTypeColor(type: string) {
    switch (type) {
        case 'executive': return 'bg-purple-100 text-purple-800'
        case 'board': return 'bg-blue-100 text-blue-800'
        case 'compliance': return 'bg-green-100 text-green-800'
        case 'technical': return 'bg-orange-100 text-orange-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}
