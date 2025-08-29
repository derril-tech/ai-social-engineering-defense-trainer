import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Target, BarChart3, Users } from 'lucide-react'

export default function Home() {
    return (
        <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-16">
                {/* Hero Section */}
                <div className="text-center mb-16">
                    <div className="flex justify-center mb-6">
                        <Shield className="h-16 w-16 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        AI Social Engineering Defense Trainer
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Safe, realistic phishing simulations with instant just-in-time coaching
                        and actionable analytics to strengthen your organization's security awareness.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                            Get Started
                        </Button>
                        <Button variant="outline" size="lg">
                            Learn More
                        </Button>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    <Card>
                        <CardHeader>
                            <Target className="h-8 w-8 text-blue-600 mb-2" />
                            <CardTitle>Multi-Channel Simulations</CardTitle>
                            <CardDescription>
                                Email, SMS, voice, chat, and web-based phishing simulations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Comprehensive attack vectors covering all modern social engineering techniques
                                with safe, sandboxed environments.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <Users className="h-8 w-8 text-green-600 mb-2" />
                            <CardTitle>Just-in-Time Coaching</CardTitle>
                            <CardDescription>
                                Instant feedback and micro-lessons on user interactions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Friendly, educational responses that turn security mistakes into
                                learning opportunities without shame or blame.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                            <CardTitle>Advanced Analytics</CardTitle>
                            <CardDescription>
                                Risk heatmaps, funnel metrics, and executive reporting
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-600">
                                Comprehensive dashboards with actionable insights for security teams
                                and compliance-ready reports for leadership.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Section */}
                <div className="text-center">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Development Status</CardTitle>
                            <CardDescription>
                                All Phases: Complete Platform - READY FOR PRODUCTION ✅
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Monorepo Setup</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Frontend Foundation</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Backend API</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Infrastructure</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Authentication & SSO</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">CI/CD Pipeline</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Content & Templates</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Multi-Channel Delivery</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Campaign Management</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Telemetry & Coaching</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Risk Scoring & Plugins</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Learning & Analytics</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Privacy & Compliance</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Security Hardening</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Testing & Deployment</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Production Monitoring</span>
                                    <span className="text-green-600 font-medium">✓ Complete</span>
                                </div>
                            </div>
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-800">
                                    🎉 ALL PHASES COMPLETED! Enterprise-ready AI Social Engineering Defense Trainer is ready for production deployment
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    )
}
