'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { IoNewspaper, IoRefresh, IoFilter, IoChevronDown, IoChevronUp, IoShield, IoWarning, IoInformationCircle, IoAirplane, IoCloud, IoGlobe, IoLink } from 'react-icons/io5'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { callAIAgent } from '@/lib/aiAgent'

const NEWS_AGENT_ID = '69a4e7c6f42837c6d016fbe4'

export interface NewsItem {
  headline: string
  summary: string
  source: string
  published_date: string
  category: string
  severity: string
  url: string
}

interface NewsSectionProps {
  sampleMode: boolean
}

const SAMPLE_NEWS: NewsItem[] = [
  {
    headline: 'Dubai International Airport Terminal 2 Expansion Complete',
    summary: 'The General Civil Aviation Authority has announced the completion of the Terminal 2 expansion project at Dubai International Airport, increasing passenger capacity by 15 million annually. New gates and lounges are now operational.',
    source: 'GCAA',
    published_date: '2024-01-15',
    category: 'airport_operations',
    severity: 'informational',
    url: 'https://www.gcaa.gov.ae'
  },
  {
    headline: 'Weather Advisory: Reduced Visibility Expected at DXB',
    summary: 'Dubai Media Office warns of fog conditions expected to affect Dubai International Airport operations over the next 48 hours. Passengers are advised to check with airlines for potential delays.',
    source: 'Dubai Media Office',
    published_date: '2024-01-15',
    category: 'weather',
    severity: 'important',
    url: 'https://www.mediaoffice.ae'
  },
  {
    headline: 'Multiple Flights Rescheduled Due to Regional Weather',
    summary: 'GCAA confirms 12 departures and 8 arrivals have been rescheduled at DXB and DWC airports due to severe weather conditions across the Gulf region. Travelers are urged to monitor flight status.',
    source: 'GCAA',
    published_date: '2024-01-14',
    category: 'flight_disruption',
    severity: 'critical',
    url: 'https://www.gcaa.gov.ae'
  },
  {
    headline: 'New Emirates Route: Dubai to Auckland Direct',
    summary: 'Dubai Media Office announces Emirates will launch a new direct service from Dubai International to Auckland, New Zealand starting March 2024, operating three times weekly.',
    source: 'Dubai Media Office',
    published_date: '2024-01-13',
    category: 'new_routes',
    severity: 'informational',
    url: 'https://www.mediaoffice.ae'
  },
  {
    headline: 'Updated GCAA Travel Advisory for UAE Transit Passengers',
    summary: 'The General Civil Aviation Authority has issued updated guidelines for transit passengers at UAE airports, including new documentation requirements effective February 1, 2024.',
    source: 'GCAA',
    published_date: '2024-01-12',
    category: 'travel_advisory',
    severity: 'important',
    url: 'https://www.gcaa.gov.ae'
  }
]

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'flight_disruption', label: 'Flight Disruptions' },
  { value: 'airport_operations', label: 'Airport Operations' },
  { value: 'travel_advisory', label: 'Travel Advisories' },
  { value: 'regulatory', label: 'Regulatory' },
  { value: 'weather', label: 'Weather' },
  { value: 'new_routes', label: 'New Routes' },
  { value: 'general', label: 'General' },
]

function getSeverityStyle(severity: string): { bg: string; text: string; icon: React.ReactNode } {
  switch (severity?.toLowerCase()) {
    case 'critical':
      return { bg: 'bg-destructive/20', text: 'text-destructive', icon: <IoWarning className="w-3 h-3" /> }
    case 'important':
      return { bg: 'bg-[hsl(35,85%,55%)]/20', text: 'text-[hsl(35,85%,55%)]', icon: <IoShield className="w-3 h-3" /> }
    case 'informational':
    default:
      return { bg: 'bg-primary/20', text: 'text-primary', icon: <IoInformationCircle className="w-3 h-3" /> }
  }
}

function getCategoryIcon(category: string): React.ReactNode {
  switch (category?.toLowerCase()) {
    case 'flight_disruption':
      return <IoAirplane className="w-3 h-3" />
    case 'airport_operations':
      return <IoGlobe className="w-3 h-3" />
    case 'weather':
      return <IoCloud className="w-3 h-3" />
    case 'travel_advisory':
      return <IoShield className="w-3 h-3" />
    case 'regulatory':
      return <IoShield className="w-3 h-3" />
    case 'new_routes':
      return <IoAirplane className="w-3 h-3" />
    default:
      return <IoNewspaper className="w-3 h-3" />
  }
}

function getCategoryLabel(category: string): string {
  return category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'General'
}

function parseAgentResponse(result: any): any {
  try {
    if (!result) return null
    if (result.response?.result && typeof result.response.result === 'object' && !Array.isArray(result.response.result)) {
      return result.response.result
    }
    const responseText = typeof result?.response === 'string'
      ? result.response
      : typeof result?.response?.result === 'string'
        ? result.response.result
        : typeof result?.response?.message === 'string'
          ? result.response.message
          : null
    if (responseText) {
      const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleaned)
    }
    if (typeof result === 'string') {
      return JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
    }
    return result?.response || result
  } catch (e) {
    return null
  }
}

export default function NewsSection({ sampleMode }: NewsSectionProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())

  const displayNews = sampleMode ? SAMPLE_NEWS : news

  const filteredNews = displayNews.filter(item => {
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter
    const matchesSearch = !searchQuery ||
      item.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const sortedNews = [...filteredNews].sort((a, b) => {
    const severityOrder: Record<string, number> = { critical: 0, important: 1, informational: 2 }
    const aSev = severityOrder[a.severity?.toLowerCase()] ?? 2
    const bSev = severityOrder[b.severity?.toLowerCase()] ?? 2
    if (aSev !== bSev) return aSev - bSev
    return new Date(b.published_date).getTime() - new Date(a.published_date).getTime()
  })

  const fetchNews = useCallback(async (query?: string) => {
    setLoading(true)
    setError(null)
    try {
      const msg = query
        ? `Get the latest official Dubai government news about: ${query}. Focus on airport and flight related news from Dubai Media Office and GCAA.`
        : 'Get the latest official Dubai government news about airports, flights, aviation, and travel from Dubai Media Office and GCAA. Include all categories: disruptions, operations, advisories, weather, new routes, and regulations.'
      const result = await callAIAgent(msg, NEWS_AGENT_ID)
      const parsed = parseAgentResponse(result)
      if (parsed && Array.isArray(parsed.news_items)) {
        setNews(parsed.news_items)
        setLastUpdated(parsed.last_updated ?? new Date().toLocaleString())
      } else if (parsed) {
        setNews([])
        setLastUpdated(new Date().toLocaleString())
      } else {
        setError('Could not parse news data from agent')
      }
    } catch (e) {
      setError('Failed to fetch news. Please try again.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!sampleMode && news.length === 0) {
      fetchNews()
    }
  }, [sampleMode])

  const toggleExpand = (index: number) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const criticalCount = sortedNews.filter(n => n.severity?.toLowerCase() === 'critical').length
  const importantCount = sortedNews.filter(n => n.severity?.toLowerCase() === 'important').length

  return (
    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <IoNewspaper className="w-5 h-5 text-primary" />
            Official Dubai News
          </h2>
          <p className="text-xs text-muted-foreground">Government-verified news from Dubai Media Office & GCAA</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground">Updated: {lastUpdated}</span>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1"
            onClick={() => fetchNews(searchQuery || undefined)}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <IoRefresh className="w-3 h-3" />}
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/50">
          <span className="text-[10px] text-muted-foreground">Total:</span>
          <span className="text-xs font-medium text-foreground">{sortedNews.length}</span>
        </div>
        {criticalCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-destructive/10">
            <IoWarning className="w-3 h-3 text-destructive" />
            <span className="text-[10px] text-destructive font-medium">{criticalCount} Critical</span>
          </div>
        )}
        {importantCount > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-[hsl(35,85%,55%)]/10">
            <IoShield className="w-3 h-3 text-[hsl(35,85%,55%)]" />
            <span className="text-[10px] text-[hsl(35,85%,55%)] font-medium">{importantCount} Important</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="border border-border bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <IoFilter className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <Input
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs bg-input border-border flex-1"
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-7 w-44 text-xs bg-input border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value} className="text-xs">{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {searchQuery && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => fetchNews(searchQuery)}
                disabled={loading}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <IoNewspaper className="w-3 h-3" />}
                Search
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 flex items-center gap-2">
            <IoWarning className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive">{error}</p>
            <Button size="sm" variant="outline" className="h-6 text-[10px] ml-auto" onClick={() => fetchNews()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && !sampleMode && (
        <Card className="border border-border bg-card">
          <CardContent className="py-8 flex flex-col items-center text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Fetching latest official news...</p>
            <p className="text-[10px] text-muted-foreground mt-1">Querying Dubai Media Office & GCAA sources</p>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && sortedNews.length === 0 && !error && (
        <Card className="border border-border bg-card">
          <CardContent className="py-8 flex flex-col items-center text-center">
            <IoNewspaper className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No news found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or refresh the feed</p>
          </CardContent>
        </Card>
      )}

      {/* News Feed */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-2">
          {sortedNews.map((item, idx) => {
            const severityStyle = getSeverityStyle(item.severity)
            const isExpanded = expandedItems.has(idx)

            return (
              <Card
                key={`${item.headline}-${idx}`}
                className={`border bg-card transition-colors ${
                  item.severity?.toLowerCase() === 'critical'
                    ? 'border-destructive/30'
                    : 'border-border hover:border-primary/30'
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 p-1 rounded ${severityStyle.bg}`}>
                      {severityStyle.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="text-sm font-medium text-foreground leading-tight cursor-pointer hover:text-primary transition-colors"
                          onClick={() => toggleExpand(idx)}
                        >
                          {item.headline}
                        </h3>
                        <button
                          onClick={() => toggleExpand(idx)}
                          className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          {isExpanded ? <IoChevronUp className="w-4 h-4" /> : <IoChevronDown className="w-4 h-4" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={`text-[10px] h-4 px-1.5 border-0 ${severityStyle.bg} ${severityStyle.text}`}>
                          {item.severity?.toUpperCase() ?? 'INFO'}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 gap-0.5">
                          {getCategoryIcon(item.category)}
                          {getCategoryLabel(item.category)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{item.source}</span>
                        <span className="text-[10px] text-muted-foreground">{item.published_date}</span>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 space-y-2">
                          <Separator className="bg-border" />
                          <p className="text-xs text-foreground leading-relaxed">{item.summary}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <IoShield className="w-3 h-3" />
                              <span>Source: {item.source}</span>
                            </div>
                            {item.url && item.url !== 'N/A' && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                              >
                                <IoLink className="w-3 h-3" />
                                View Source
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>

      {/* Source Attribution */}
      <div className="flex items-center justify-center gap-2 py-2 border-t border-border">
        <IoShield className="w-3 h-3 text-accent" />
        <span className="text-[10px] text-muted-foreground">
          All news sourced exclusively from Dubai Media Office and GCAA official channels
        </span>
      </div>
    </div>
  )
}
