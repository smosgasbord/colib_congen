"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Loader2,
  Sparkles,
  Users,
  MessageSquare,
  Briefcase,
  Camera,
  AlertCircle,
  Info,
  ExternalLink,
} from "lucide-react"
import { generateContentIdeas } from "./actions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const platforms = [
  { id: "twitter", name: "Twitter", icon: MessageSquare, color: "text-blue-500" },
  { id: "instagram", name: "Instagram", icon: Camera, color: "text-pink-500" },
  { id: "facebook", name: "Facebook", icon: Users, color: "text-blue-600" },
  { id: "linkedin", name: "LinkedIn", icon: Briefcase, color: "text-blue-700" },
]

interface ContentIdea {
  platform: string
  ideas: string[]
  scripts?: string[]
  bulletPoints?: string[]
}

interface WebhookContentItem {
  title: string
  description: string
  source_link?: string
  publication?: string
}

export default function HomePage() {
  const [topic, setTopic] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [contentIdeas, setContentIdeas] = useState<any>(null)
  const [isMockData, setIsMockData] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!topic.trim()) {
      setError("Please enter a topic")
      return
    }

    if (!selectedPlatform) {
      setError("Please select a platform")
      return
    }

    setIsLoading(true)
    setContentIdeas(null)
    setIsMockData(false)
    setError("")

    try {
      const result = await generateContentIdeas(topic, [selectedPlatform])
      if (result.success) {
        setContentIdeas(result.data)
        setIsMockData(result.isMock || false)
      } else {
        setError(result.error || "Failed to generate content ideas")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const renderContentSection = (title: string, content: string[] | undefined) => {
    if (!content || content.length === 0) return null

    return (
      <div className="space-y-2">
        <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">{title}</h4>
        <ul className="space-y-1">
          {content.map((item, index) => (
            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 pl-4 relative">
              <span className="absolute left-0 top-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  const renderWebhookContent = (items: WebhookContentItem[]) => {
    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={index} className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{item.description}</p>
                {item.source_link && (
                  <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                    <ExternalLink className="w-4 h-4" />
                    <a href={item.source_link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {item.publication || "Source"}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const selectedPlatformData = platforms.find((p) => p.id === selectedPlatform)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Social Media Content Generator</h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Generate engaging social media content ideas tailored to your topic and preferred platform
          </p>
        </div>

        {/* Input Form */}
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>Generate Content Ideas</CardTitle>
            <CardDescription>Enter your topic and select the platform you want content ideas for</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Topic Input */}
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., sustainable living, digital marketing, fitness tips..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Platform Selection */}
              <div className="space-y-3">
                <Label>Select Platform</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a platform..." />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => {
                      const Icon = platform.icon
                      return (
                        <SelectItem key={platform.id} value={platform.id}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${platform.color}`} />
                            {platform.name}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-red-800 dark:text-red-200 text-sm font-medium">Error</p>
                      <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gathering information and generating ideas...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Content Ideas
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && selectedPlatformData && (
          <Card className="max-w-2xl mx-auto mb-8">
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <Sparkles className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Gathering information and generating ideas...
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Please wait while we create personalized content for {selectedPlatformData.name}. This may take
                    several minutes.
                  </p>
                </div>
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full">
                  <selectedPlatformData.icon className={`w-5 h-5 ${selectedPlatformData.color}`} />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{selectedPlatformData.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mock Data Notice */}
        {isMockData && contentIdeas && (
          <Alert className="max-w-4xl mx-auto mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Demo Mode:</strong> The webhook is currently experiencing timeouts, so we're showing sample
              content ideas. The actual webhook integration will provide AI-generated content once the timeout issues
              are resolved.
            </AlertDescription>
          </Alert>
        )}

        {/* Results */}
        {contentIdeas && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              Generated Content Ideas
            </h2>

            {/* Check if it's webhook format (array with title/description) or legacy format */}
            {Array.isArray(contentIdeas) && contentIdeas.length > 0 && contentIdeas[0].title ? (
              // New webhook format
              renderWebhookContent(contentIdeas)
            ) : Array.isArray(contentIdeas) ? (
              // Legacy format
              <div className="grid gap-6">
                {contentIdeas.map((platformData: any, index: number) => {
                  const platform = platforms.find((p) => p.id === platformData.platform?.toLowerCase())
                  const Icon = platform?.icon || MessageSquare

                  return (
                    <Card key={index} className="w-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${platform?.color || "text-gray-500"}`} />
                          {platformData.platform || "Platform"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {renderContentSection("Content Ideas", platformData.ideas)}
                        {renderContentSection("Scripts", platformData.scripts)}
                        {renderContentSection("Key Points", platformData.bulletPoints)}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              // Raw format
              <Card>
                <CardHeader>
                  <CardTitle>Content Ideas for: {topic}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto">
                      {typeof contentIdeas === "string" ? contentIdeas : JSON.stringify(contentIdeas, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
