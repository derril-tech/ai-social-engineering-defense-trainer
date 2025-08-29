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
import { Plus, Eye, Edit, Trash2, Wand2, Shield, AlertTriangle } from 'lucide-react'

interface Template {
    id: string
    name: string
    type: 'email' | 'sms' | 'voice' | 'chat' | 'web'
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    category: string
    description: string
    content: string
    tags: string[]
    isPublic: boolean
    createdAt: string
    updatedAt: string
}

const mockTemplates: Template[] = [
    {
        id: '1',
        name: 'Urgent Security Update',
        type: 'email',
        difficulty: 'beginner',
        category: 'Security Alert',
        description: 'Basic phishing simulation requesting immediate security update',
        content: 'Subject: [TRAINING SIMULATION] Urgent Security Update Required\n\nDear {{user_name}},\n\nYour account requires immediate attention...',
        tags: ['security', 'urgent', 'beginner'],
        isPublic: true,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
    },
    {
        id: '2',
        name: 'Prize Winner SMS',
        type: 'sms',
        difficulty: 'intermediate',
        category: 'Prize Scam',
        description: 'SMS simulation claiming user won a prize',
        content: '[TRAINING SIM] Congratulations! You\'ve won $1000. Click to claim: [SAFE_LINK]',
        tags: ['prize', 'sms', 'intermediate'],
        isPublic: false,
        createdAt: '2024-01-14T15:30:00Z',
        updatedAt: '2024-01-14T15:30:00Z'
    }
]

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>(mockTemplates)
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<string>('all')
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all')

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesType = filterType === 'all' || template.type === filterType
        const matchesDifficulty = filterDifficulty === 'all' || template.difficulty === filterDifficulty

        return matchesSearch && matchesType && matchesDifficulty
    })

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800'
            case 'intermediate': return 'bg-yellow-100 text-yellow-800'
            case 'advanced': return 'bg-orange-100 text-orange-800'
            case 'expert': return 'bg-red-100 text-red-800'
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Template Studio</h1>
                    <p className="text-gray-600 mt-2">Create and manage simulation templates with built-in safety guardrails</p>
                </div>
                <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                </Button>
            </div>

            {/* Safety Notice */}
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
                <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-yellow-800">Safety Guardrails Active</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                All templates are automatically validated for safety compliance. Training watermarks and educational tells are enforced.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="library" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="library">Template Library</TabsTrigger>
                    <TabsTrigger value="builder">Template Builder</TabsTrigger>
                    <TabsTrigger value="ai-generator">AI Generator</TabsTrigger>
                </TabsList>

                <TabsContent value="library" className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <Label htmlFor="search">Search Templates</Label>
                                    <Input
                                        id="search"
                                        placeholder="Search by name, description, or tags..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="type-filter">Type</Label>
                                    <Select value={filterType} onValueChange={setFilterType}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All types" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="sms">SMS</SelectItem>
                                            <SelectItem value="voice">Voice</SelectItem>
                                            <SelectItem value="chat">Chat</SelectItem>
                                            <SelectItem value="web">Web</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="difficulty-filter">Difficulty</Label>
                                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="All difficulties" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Difficulties</SelectItem>
                                            <SelectItem value="beginner">Beginner</SelectItem>
                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                            <SelectItem value="advanced">Advanced</SelectItem>
                                            <SelectItem value="expert">Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-end">
                                    <Button variant="outline" className="w-full">
                                        <Wand2 className="h-4 w-4 mr-2" />
                                        Generate with AI
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Template Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <Card key={template.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-2xl">{getTypeIcon(template.type)}</span>
                                            <div>
                                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                                <CardDescription className="text-sm">{template.category}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge className={getDifficultyColor(template.difficulty)}>
                                            {template.difficulty}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {template.tags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-1">
                                            {template.isPublic && (
                                                <Badge variant="outline" className="text-xs">
                                                    Public
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button size="sm" variant="outline" onClick={() => setSelectedTemplate(template)}>
                                                <Eye className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="outline">
                                                <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                        <Card>
                            <CardContent className="pt-6 text-center">
                                <p className="text-gray-500">No templates found matching your criteria.</p>
                                <Button className="mt-4" onClick={() => setIsCreating(true)}>
                                    Create Your First Template
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="builder" className="space-y-6">
                    <TemplateBuilder />
                </TabsContent>

                <TabsContent value="ai-generator" className="space-y-6">
                    <AITemplateGenerator />
                </TabsContent>
            </Tabs>

            {/* Template Preview Modal */}
            {selectedTemplate && (
                <TemplatePreviewModal
                    template={selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                />
            )}
        </div>
    )
}

function TemplateBuilder() {
    const [templateData, setTemplateData] = useState({
        name: '',
        type: 'email',
        difficulty: 'beginner',
        category: '',
        description: '',
        content: '',
        tags: ''
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Template Builder</CardTitle>
                <CardDescription>
                    Create custom simulation templates with built-in safety validation
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input
                            id="template-name"
                            placeholder="Enter template name..."
                            value={templateData.name}
                            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label htmlFor="template-type">Type</Label>
                        <Select value={templateData.type} onValueChange={(value) => setTemplateData({ ...templateData, type: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="email">📧 Email</SelectItem>
                                <SelectItem value="sms">📱 SMS</SelectItem>
                                <SelectItem value="voice">📞 Voice</SelectItem>
                                <SelectItem value="chat">💬 Chat</SelectItem>
                                <SelectItem value="web">🌐 Web</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="template-difficulty">Difficulty</Label>
                        <Select value={templateData.difficulty} onValueChange={(value) => setTemplateData({ ...templateData, difficulty: value })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="template-category">Category</Label>
                        <Input
                            id="template-category"
                            placeholder="e.g., Security Alert, Prize Scam..."
                            value={templateData.category}
                            onChange={(e) => setTemplateData({ ...templateData, category: e.target.value })}
                        />
                    </div>
                </div>

                <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                        id="template-description"
                        placeholder="Describe what this template simulates..."
                        value={templateData.description}
                        onChange={(e) => setTemplateData({ ...templateData, description: e.target.value })}
                    />
                </div>

                <div>
                    <Label htmlFor="template-content">Template Content</Label>
                    <Textarea
                        id="template-content"
                        placeholder="Enter your template content here. Use {{user_name}} for personalization..."
                        className="min-h-[200px] font-mono text-sm"
                        value={templateData.content}
                        onChange={(e) => setTemplateData({ ...templateData, content: e.target.value })}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Safety watermarks and training indicators will be automatically added
                    </p>
                </div>

                <div>
                    <Label htmlFor="template-tags">Tags (comma-separated)</Label>
                    <Input
                        id="template-tags"
                        placeholder="security, urgent, beginner..."
                        value={templateData.tags}
                        onChange={(e) => setTemplateData({ ...templateData, tags: e.target.value })}
                    />
                </div>

                <div className="flex space-x-4">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                        <Shield className="h-4 w-4 mr-2" />
                        Validate & Save
                    </Button>
                    <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function AITemplateGenerator() {
    const [generationParams, setGenerationParams] = useState({
        type: 'email',
        difficulty: 'beginner',
        theme: '',
        organizationContext: '',
        customPrompt: ''
    })

    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        setIsGenerating(true)
        // Simulate AI generation
        setTimeout(() => {
            setIsGenerating(false)
        }, 3000)
    }

    return (
        <div className="space-y-6">
            <Card className="border-purple-200 bg-purple-50">
                <CardContent className="pt-6">
                    <div className="flex items-start space-x-3">
                        <Wand2 className="h-5 w-5 text-purple-600 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-purple-800">AI-Powered Template Generation</h3>
                            <p className="text-sm text-purple-700 mt-1">
                                Generate contextual, safe simulation templates using advanced AI with built-in safety guardrails.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Generate Template with AI</CardTitle>
                    <CardDescription>
                        Specify your requirements and let AI create a safe, educational simulation template
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="ai-type">Simulation Type</Label>
                            <Select value={generationParams.type} onValueChange={(value) => setGenerationParams({ ...generationParams, type: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email">📧 Phishing Email</SelectItem>
                                    <SelectItem value="sms">📱 Smishing SMS</SelectItem>
                                    <SelectItem value="voice">📞 Vishing Script</SelectItem>
                                    <SelectItem value="chat">💬 Chat Message</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="ai-difficulty">Difficulty Level</Label>
                            <Select value={generationParams.difficulty} onValueChange={(value) => setGenerationParams({ ...generationParams, difficulty: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="beginner">Beginner - Obvious tells</SelectItem>
                                    <SelectItem value="intermediate">Intermediate - Some tells</SelectItem>
                                    <SelectItem value="advanced">Advanced - Subtle tells</SelectItem>
                                    <SelectItem value="expert">Expert - Minimal tells</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="ai-theme">Theme/Scenario</Label>
                        <Input
                            id="ai-theme"
                            placeholder="e.g., Security update, Account verification, Prize notification..."
                            value={generationParams.theme}
                            onChange={(e) => setGenerationParams({ ...generationParams, theme: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="ai-context">Organization Context (Optional)</Label>
                        <Input
                            id="ai-context"
                            placeholder="e.g., Tech company, Healthcare, Financial services..."
                            value={generationParams.organizationContext}
                            onChange={(e) => setGenerationParams({ ...generationParams, organizationContext: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="ai-prompt">Custom Instructions (Optional)</Label>
                        <Textarea
                            id="ai-prompt"
                            placeholder="Any specific requirements or elements to include..."
                            value={generationParams.customPrompt}
                            onChange={(e) => setGenerationParams({ ...generationParams, customPrompt: e.target.value })}
                        />
                    </div>

                    <div className="flex space-x-4">
                        <Button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Generate Template
                                </>
                            )}
                        </Button>
                        <Button variant="outline">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            Safety Guidelines
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function TemplatePreviewModal({ template, onClose }: { template: Template; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <span className="text-2xl">{getTypeIcon(template.type)}</span>
                                <span>{template.name}</span>
                            </CardTitle>
                            <CardDescription>{template.description}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            ✕
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex space-x-2">
                            <Badge className={getDifficultyColor(template.difficulty)}>
                                {template.difficulty}
                            </Badge>
                            <Badge variant="outline">{template.category}</Badge>
                            {template.isPublic && <Badge variant="outline">Public</Badge>}
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Template Content:</h4>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <pre className="whitespace-pre-wrap text-sm font-mono">{template.content}</pre>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold mb-2">Tags:</h4>
                            <div className="flex flex-wrap gap-1">
                                {template.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-4 pt-4">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                Use Template
                            </Button>
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button variant="outline">
                                Duplicate
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
        case 'beginner': return 'bg-green-100 text-green-800'
        case 'intermediate': return 'bg-yellow-100 text-yellow-800'
        case 'advanced': return 'bg-orange-100 text-orange-800'
        case 'expert': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
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
