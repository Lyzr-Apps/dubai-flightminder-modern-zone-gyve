'use client'

import React, { useState } from 'react'
import { IoNotifications, IoFilter, IoChevronDown, IoChevronUp, IoTime, IoCall, IoLogoWhatsapp, IoMail } from 'react-icons/io5'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

export interface AlertEntry {
  id: string
  alert_reference?: string
  flight_number: string
  alert_type: string
  sms_message?: string
  whatsapp_message?: string
  delivery_status?: string
  timestamp: string
  shelter_info?: string
}

interface AlertHistorySectionProps {
  alerts: AlertEntry[]
  sampleMode: boolean
}

function getAlertTypeBadge(type: string): string {
  const t = type.toLowerCase()
  if (t.includes('cancel')) return 'bg-destructive/20 text-destructive'
  if (t.includes('delay') || t.includes('reschedul')) return 'bg-[hsl(35,85%,55%)]/20 text-[hsl(35,85%,55%)]'
  if (t.includes('divert')) return 'bg-[hsl(35,85%,55%)]/20 text-[hsl(35,85%,55%)]'
  if (t.includes('shelter') || t.includes('assist')) return 'bg-primary/20 text-primary'
  return 'bg-muted text-muted-foreground'
}

export default function AlertHistorySection({ alerts, sampleMode }: AlertHistorySectionProps) {
  const [filterFlight, setFilterFlight] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = alerts.filter((a) => {
    if (filterFlight && !a.flight_number.toLowerCase().includes(filterFlight.toLowerCase())) return false
    if (filterType !== 'all' && !a.alert_type.toLowerCase().includes(filterType)) return false
    return true
  })

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Alert History</h2>
        <p className="text-xs text-muted-foreground">Chronological timeline of all sent notifications</p>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <IoFilter className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Filter by flight number..."
              value={filterFlight}
              onChange={(e) => setFilterFlight(e.target.value)}
              className="h-7 text-xs bg-input border-border flex-1"
            />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-7 w-36 text-xs bg-input border-border">
                <SelectValue placeholder="Alert type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="cancel" className="text-xs">Cancellation</SelectItem>
                <SelectItem value="delay" className="text-xs">Delay</SelectItem>
                <SelectItem value="divert" className="text-xs">Diversion</SelectItem>
                <SelectItem value="shelter" className="text-xs">Shelter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">{filtered.length} alert{filtered.length !== 1 ? 's' : ''} found</div>

      {filtered.length === 0 && !sampleMode && (
        <Card className="border border-border bg-card">
          <CardContent className="py-8 flex flex-col items-center text-center">
            <IoNotifications className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No alerts sent yet</p>
            <p className="text-xs text-muted-foreground mt-1">Alerts will appear here when disruptions are detected</p>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-1.5">
          {filtered.map((alert) => {
            const isExpanded = expandedId === alert.id
            return (
              <Card key={alert.id} className="border border-border bg-card">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : alert.id)}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{alert.flight_number}</span>
                          <Badge className={`text-[10px] h-4 px-1 border-0 ${getAlertTypeBadge(alert.alert_type)}`}>
                            {alert.alert_type}
                          </Badge>
                          {alert.delivery_status && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1">
                              {alert.delivery_status}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <IoTime className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[10px] text-muted-foreground">{alert.timestamp}</span>
                          {alert.alert_reference && (
                            <span className="text-[10px] text-muted-foreground ml-2">Ref: {alert.alert_reference}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {isExpanded ? <IoChevronUp className="w-3 h-3" /> : <IoChevronDown className="w-3 h-3" />}
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 pt-2 border-t border-border space-y-2">
                      {alert.sms_message && (
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            <IoCall className="w-3 h-3 text-muted-foreground" />
                            <span className="text-[10px] font-medium text-muted-foreground">SMS</span>
                          </div>
                          <p className="text-xs text-foreground bg-secondary/50 rounded p-2">{alert.sms_message}</p>
                        </div>
                      )}
                      {alert.whatsapp_message && (
                        <div>
                          <div className="flex items-center gap-1 mb-0.5">
                            <IoLogoWhatsapp className="w-3 h-3 text-accent" />
                            <span className="text-[10px] font-medium text-muted-foreground">WhatsApp</span>
                          </div>
                          <p className="text-xs text-foreground bg-secondary/50 rounded p-2">{alert.whatsapp_message}</p>
                        </div>
                      )}
                      {alert.shelter_info && (
                        <div>
                          <span className="text-[10px] font-medium text-muted-foreground">Shelter Info</span>
                          <p className="text-xs text-foreground">{alert.shelter_info}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
