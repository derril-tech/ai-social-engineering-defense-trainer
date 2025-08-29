'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Clock, CheckCircle, Award, Target, TrendingUp, Users, Shield } from 'lucide-react'

interface MicroLesson {
    id: string
    title: string
    description: string
    duration: number // minutes
    difficulty: 'beginner' | 'intermediate' | 'advanced'
    standard: string // NIST, ISO, etc.
    category: string
    completionRate: number
    userProgress: 'not_started' | 'in_progress' | 'completed'
    score?: number
    lastAccessed?: string
    prerequisites: string[]
    learningObjectives: string[]
}

interface LearningPath {
    id: string
    name: string
    description: string
    totalLessons: number
    completedLessons: number
    estimatedTime: number
    difficulty: string
    standard: string
    lessons: string[]
}

const mockMicroLessons: MicroLesson[] = [
    {
        id: '1',
        title: 'Phishing Email Identification',
        description: 'Learn to identify common phishing email tactics and red flags',
        duration: 5,
        difficulty: 'beginner',
        standard: 'NIST CSF',
        category: 'Email Security',
        completionRate: 85,
        userProgress: 'completed',
        score: 92,
        lastAccessed: '2024-01-15T10:30:00Z',
        prerequisites: [],
        learningObjectives: [
            'Identify suspicious sender addresses',
            'Recognize urgent language tactics',
            'Spot spelling and grammar errors',
            'Verify links before clicking'
        ]
    },
    {
        id: '2',
        title: 'Social Engineering Psychology',
        description: 'Understand the psychological tactics used in social engineering attacks',
        duration: 8,
        difficulty: 'intermediate',
        standard: 'ISO 27001',
        category: 'Psychology',
        completionRate: 67,
        userProgress: 'in_progress',
        lastAccessed: '2024-01-14T16:45:00Z',
        prerequisites: ['1'],
        learningObjectives: [
            'Understand authority exploitation',
            'Recognize urgency manipulation',
            'Identify trust-building techniques',
            'Spot emotional manipulation'
        ]
    },
    {
        id: '3',
        title: 'Advanced Spear Phishing Detection',
        description: 'Advanced techniques for detecting targeted spear phishing attacks',
        duration: 12,
        difficulty: 'advanced',
        standard: 'NIST CSF',
        category: 'Advanced Threats',
        completionRate: 23,
        userProgress: 'not_started',
        prerequisites: ['1', '2'],
        learningObjectives: [
            'Analyze sophisticated targeting',
            'Detect business email compromise',
            'Identify credential harvesting',
            'Recognize advanced persistent threats'
        ]
    }
]

const mockLearningPaths: LearningPath[] = [
    {
        id: '1',
        name: 'Email Security Fundamentals',
        description: 'Complete foundation in email security and phishing prevention',
        totalLessons: 6,
        completedLessons: 4,
        estimatedTime: 45,
        difficulty: 'beginner',
        standard: 'NIST CSF',
        lessons: ['1', '2', '4', '5', '6', '7']
    },
    {
        id: '2',
        name: 'Advanced Threat Detection',
        description: 'Advanced skills for detecting sophisticated cyber threats',
        totalLessons: 8,
        completedLessons: 1,
        estimatedTime: 90,
        difficulty: 'advanced',
        standard: 'ISO 27001',
        lessons: ['3', '8', '9', '10', '11', '12', '13', '14']
    }
]

export default function LearningPage() {
    const [selectedLesson, setSelectedLesson] = useState<MicroLesson | null>(null)
    const [activeTab, setActiveTab] = useState('lessons')

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'bg-green-100 text-green-800'
            case 'intermediate': return 'bg-yellow-100 text-yellow-800'
            case 'advanced': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getProgressColor = (progress: string) => {
        switch (progress) {
            case 'completed': return 'text-green-600'
            case 'in_progress': return 'text-blue-600'
            case 'not_started': return 'text-gray-400'
            default: return 'text-gray-400'
        }
    }

    const getProgressIcon = (progress: string) => {
        switch (progress) {
            case 'completed': return <CheckCircle className="h-5 w-5 text-green-600" />
            case 'in_progress': return <Clock className="h-5 w-5 text-blue-600" />
            case 'not_started': return <BookOpen className="h-5 w-5 text-gray-400" />
            default: return <BookOpen className="h-5 w-5 text-gray-400" />
        }
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Learning Center</h1>
                    <p className="text-gray-600 mt-2">Micro-lessons and learning paths mapped to security standards</p>
                </div>
                <div className="flex space-x-4">
                    <Button variant="outline">
                        <Award className="h-4 w-4 mr-2" />
                        Certificates
                    </Button>
                    <Button>
                        <Target className="h-4 w-4 mr-2" />
                        My Progress
                    </Button>
                </div>
            </div>

            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <BookOpen className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">24</p>
                                <p className="text-sm text-gray-600">Total Lessons</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">18</p>
                                <p className="text-sm text-gray-600">Completed</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Clock className="h-8 w-8 text-orange-600" />
                            <div>
                                <p className="text-2xl font-bold">3</p>
                                <p className="text-sm text-gray-600">In Progress</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center space-x-2">
                            <Award className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">85%</p>
                                <p className="text-sm text-gray-600">Completion Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="lessons">Micro-Lessons</TabsTrigger>
                    <TabsTrigger value="paths">Learning Paths</TabsTrigger>
                    <TabsTrigger value="standards">Standards Mapping</TabsTrigger>
                    <TabsTrigger value="analytics">Learning Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="lessons" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {mockMicroLessons.map((lesson) => (
                            <Card key={lesson.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedLesson(lesson)}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-2">
                                            {getProgressIcon(lesson.userProgress)}
                                            <div>
                                                <CardTitle className="text-lg">{lesson.title}</CardTitle>
                                                <CardDescription className="text-sm">{lesson.category}</CardDescription>
                                            </div>
                                        </div>
                                        <Badge className={getDifficultyColor(lesson.difficulty)}>
                                            {lesson.difficulty}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-4">{lesson.description}</p>

                                    <div className="flex items-center justify-between text-sm mb-4">
                                        <div className="flex items-center space-x-1">
                                            <Clock className="h-4 w-4 text-gray-400" />
                                            <span>{lesson.duration} min</span>
                                        </div>
                                        <Badge variant="outline">{lesson.standard}</Badge>
                                    </div>

                                    {lesson.userProgress === 'completed' && lesson.score && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Score</span>
                                                <span className="font-semibold">{lesson.score}%</span>
                                            </div>
                                            <Progress value={lesson.score} className="h-2" />
                                        </div>
                                    )}

                                    {lesson.userProgress === 'in_progress' && (
                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Progress</span>
                                                <span className="font-semibold">60%</span>
                                            </div>
                                            <Progress value={60} className="h-2" />
                                        </div>
                                    )}

                                    <div className="flex space-x-2">
                                        <Button size="sm" className="flex-1">
                                            {lesson.userProgress === 'completed' ? 'Review' :
                                                lesson.userProgress === 'in_progress' ? 'Continue' : 'Start'}
                                        </Button>
                                        {lesson.userProgress === 'completed' && (
                                            <Button size="sm" variant="outline">
                                                Certificate
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="paths" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {mockLearningPaths.map((path) => (
                            <Card key={path.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-xl">{path.name}</CardTitle>
                                            <CardDescription>{path.description}</CardDescription>
                                        </div>
                                        <Badge className={getDifficultyColor(path.difficulty)}>
                                            {path.difficulty}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Progress</span>
                                            <span className="text-sm font-semibold">
                                                {path.completedLessons}/{path.totalLessons} lessons
                                            </span>
                                        </div>
                                        <Progress value={(path.completedLessons / path.totalLessons) * 100} className="h-2" />

                                        <div className="flex justify-between text-sm text-gray-600">
                                            <div className="flex items-center space-x-1">
                                                <Clock className="h-4 w-4" />
                                                <span>{path.estimatedTime} min total</span>
                                            </div>
                                            <Badge variant="outline">{path.standard}</Badge>
                                        </div>

                                        <Button className="w-full">
                                            {path.completedLessons === 0 ? 'Start Path' : 'Continue Path'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="standards" className="space-y-6">
                    <StandardsMapping />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                    <LearningAnalytics />
                </TabsContent>
            </Tabs>

            {/* Lesson Detail Modal */}
            {selectedLesson && (
                <LessonDetailModal
                    lesson={selectedLesson}
                    onClose={() => setSelectedLesson(null)}
                />
            )}
        </div>
    )
}

function StandardsMapping() {
    const standards = [
        {
            name: 'NIST Cybersecurity Framework',
            code: 'NIST CSF',
            mappedLessons: 12,
            coverage: 85,
            categories: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover']
        },
        {
            name: 'ISO 27001',
            code: 'ISO 27001',
            mappedLessons: 8,
            coverage: 72,
            categories: ['Information Security Management', 'Risk Management', 'Controls']
        },
        {
            name: 'SANS Security Awareness',
            code: 'SANS',
            mappedLessons: 15,
            coverage: 95,
            categories: ['Email Security', 'Web Security', 'Social Engineering', 'Mobile Security']
        }
    ]

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Standards Compliance Overview</CardTitle>
                    <CardDescription>
                        Micro-lessons mapped to industry security standards and frameworks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {standards.map((standard) => (
                            <div key={standard.code} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{standard.name}</h3>
                                        <p className="text-sm text-gray-600">{standard.code}</p>
                                    </div>
                                    <Badge variant="outline">{standard.mappedLessons} lessons</Badge>
                                </div>

                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Coverage</span>
                                        <span className="font-semibold">{standard.coverage}%</span>
                                    </div>
                                    <Progress value={standard.coverage} className="h-2" />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {standard.categories.map((category) => (
                                        <Badge key={category} variant="secondary" className="text-xs">
                                            {category}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function LearningAnalytics() {
    return (
        <div className="space-y-6">
            {/* Learning Progress Chart */}
            <Card>
                <CardHeader>
                    <CardTitle>Learning Progress Over Time</CardTitle>
                    <CardDescription>Your learning journey and completion trends</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                        <div className="text-center">
                            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">Learning progress chart would be displayed here</p>
                            <p className="text-sm text-gray-400">Integration with charting library needed</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Competency Assessment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Competency Levels</CardTitle>
                        <CardDescription>Your skill levels across security domains</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { domain: 'Email Security', level: 85, color: 'bg-green-500' },
                                { domain: 'Social Engineering', level: 72, color: 'bg-blue-500' },
                                { domain: 'Incident Response', level: 45, color: 'bg-yellow-500' },
                                { domain: 'Advanced Threats', level: 28, color: 'bg-red-500' }
                            ].map((competency) => (
                                <div key={competency.domain}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{competency.domain}</span>
                                        <span className="font-semibold">{competency.level}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`${competency.color} h-2 rounded-full`}
                                            style={{ width: `${competency.level}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Learning Recommendations</CardTitle>
                        <CardDescription>Personalized suggestions based on your progress</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <h4 className="font-semibold text-sm text-blue-800">Focus Area</h4>
                                <p className="text-sm text-blue-700">Complete Advanced Spear Phishing Detection to improve threat recognition skills</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <h4 className="font-semibold text-sm text-green-800">Strength</h4>
                                <p className="text-sm text-green-700">Excellent progress in Email Security fundamentals - consider advanced modules</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <h4 className="font-semibold text-sm text-yellow-800">Opportunity</h4>
                                <p className="text-sm text-yellow-700">Incident Response skills need attention - start with basic response procedures</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function LessonDetailModal({ lesson, onClose }: { lesson: MicroLesson; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl">{lesson.title}</CardTitle>
                            <CardDescription>{lesson.description}</CardDescription>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            ✕
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Lesson Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">Duration</h4>
                                <div className="flex items-center space-x-1">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{lesson.duration} minutes</span>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Difficulty</h4>
                                <Badge className={getDifficultyColor(lesson.difficulty)}>
                                    {lesson.difficulty}
                                </Badge>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Standard</h4>
                                <Badge variant="outline">{lesson.standard}</Badge>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">Category</h4>
                                <span className="text-sm">{lesson.category}</span>
                            </div>
                        </div>

                        {/* Learning Objectives */}
                        <div>
                            <h4 className="font-semibold mb-2">Learning Objectives</h4>
                            <ul className="space-y-1">
                                {lesson.learningObjectives.map((objective, index) => (
                                    <li key={index} className="flex items-start space-x-2">
                                        <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm">{objective}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Prerequisites */}
                        {lesson.prerequisites.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">Prerequisites</h4>
                                <div className="flex flex-wrap gap-2">
                                    {lesson.prerequisites.map((prereq) => (
                                        <Badge key={prereq} variant="secondary">
                                            Lesson {prereq}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Progress */}
                        {lesson.userProgress === 'completed' && lesson.score && (
                            <div>
                                <h4 className="font-semibold mb-2">Your Score</h4>
                                <div className="flex items-center space-x-4">
                                    <div className="flex-1">
                                        <Progress value={lesson.score} className="h-3" />
                                    </div>
                                    <span className="font-semibold text-lg">{lesson.score}%</span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-4 pt-4">
                            <Button className="flex-1">
                                {lesson.userProgress === 'completed' ? 'Review Lesson' :
                                    lesson.userProgress === 'in_progress' ? 'Continue Lesson' : 'Start Lesson'}
                            </Button>
                            {lesson.userProgress === 'completed' && (
                                <Button variant="outline">
                                    <Award className="h-4 w-4 mr-2" />
                                    Get Certificate
                                </Button>
                            )}
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
        case 'advanced': return 'bg-red-100 text-red-800'
        default: return 'bg-gray-100 text-gray-800'
    }
}
