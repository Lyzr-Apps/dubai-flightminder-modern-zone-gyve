'use client'

import React from 'react'
import { IoAirplane, IoLocationSharp, IoShield, IoTime, IoCheckmarkCircle, IoWarning, IoNavigate, IoSend, IoArrowBack, IoCall } from 'react-icons/io5'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'
import type { MonitoredFlight } from './DashboardSection'
import type { AlertEntry } from './AlertHistorySection'

interface FlightDetailSectionProps {
  flight: MonitoredFlight | null
  alerts: AlertEntry[]
  loading: boolean
  onSendAlert: (flightNumber: string) => void
  onBack: () => void
  onCheckNow: (flightId: string) => void
}

function getStatusColor(status?: string): string {
  if (!status) return 'bg-muted text-muted-foreground'
  const s = status.toLowerCase()
  if (s.includes('on time') || s.includes('on-time') || s.includes('scheduled') || s.includes('landed')) return 'bg-accent/20 text-accent'
  if (s.includes('delay') || s.includes('reschedul')) return 'bg-[hsl(35,85%,55%)]/20 text-[hsl(35,85%,55%)]'
  if (s.includes('cancel')) return 'bg-destructive/20 text-destructive'
  if (s.includes('divert')) return 'bg-[hsl(35,85%,55%)]/20 text-[hsl(35,85%,55%)]'
  if (s.includes('monitor')) return 'bg-primary/20 text-primary'
  return 'bg-muted text-muted-foreground'
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-xs mt-2 mb-0.5">{line.slice(4)}</h4>
        if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-sm mt-2 mb-0.5">{line.slice(3)}</h3>
        if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-base mt-3 mb-1">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 list-disc text-xs">{line.slice(2)}</li>
        if (!line.trim()) return <div key={i} className="h-0.5" />
        return <p key={i} className="text-xs">{line}</p>
      })}
    </div>
  )
}

export default function FlightDetailSection({ flight, alerts, loading, onSendAlert, onBack, onCheckNow }: FlightDetailSectionProps) {
  if (!flight) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center">
        <IoAirplane className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">No flight selected</p>
        <p className="text-xs text-muted-foreground mt-1">Select a flight from the Dashboard to view details</p>
        <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={onBack}>
          <IoArrowBack className="w-3 h-3 mr-1" /> Go to Dashboard
        </Button>
      </div>
    )
  }

  const flightAlerts = alerts.filter(a => a.flight_number === flight.flight_number)

  return (
    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onBack}>
          <IoArrowBack className="w-3 h-3" /> Back
        </Button>
      </div>

      <Card className="border border-border bg-card">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-primary/20 flex items-center justify-center">
                <IoAirplane className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{flight.flight_number}</h2>
                {flight.airline && <p className="text-xs text-muted-foreground">{flight.airline}</p>}
                {flight.route && <p className="text-xs text-muted-foreground">{flight.route}</p>}
              </div>
            </div>
            <Badge className={`text-xs h-6 px-2 border-0 ${getStatusColor(flight.status)}`}>
              {flight.status ?? 'Monitoring'}
            </Badge>
          </div>

          {flight.status_detail && (
            <div className="mt-3 p-2 rounded bg-secondary/50">
              {renderMarkdown(flight.status_detail)}
            </div>
          )}

          {(flight.original_time || flight.new_time) && (
            <div className="mt-3 flex items-center gap-4 text-xs">
              {flight.original_time && (
                <div>
                  <span className="text-muted-foreground">Original: </span>
                  <span className={`font-medium ${flight.new_time ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{flight.original_time}</span>
                </div>
              )}
              {flight.new_time && (
                <div>
                  <span className="text-muted-foreground">New: </span>
                  <span className="font-medium text-destructive">{flight.new_time}</span>
                </div>
              )}
            </div>
          )}

          {flight.is_disruption && (
            <div className="mt-2 flex items-center gap-1 text-destructive">
              <IoWarning className="w-4 h-4" />
              <span className="text-xs font-medium">Disruption Confirmed</span>
            </div>
          )}
        </CardContent>
      </Card>

      {flight.verified_source && (
        <Card className="border border-border bg-card">
          <CardContent className="p-3 flex items-center gap-2">
            <IoShield className="w-4 h-4 text-accent" />
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">Verified via {flight.verified_source}</p>
              <p className="text-[10px] text-muted-foreground">
                Last updated: {flight.last_checked ?? 'Unknown'}
              </p>
            </div>
            <IoCheckmarkCircle className="w-4 h-4 text-accent" />
          </CardContent>
        </Card>
      )}

      {flight.shelter_name && (
        <Card className="border border-border bg-card">
          <CardHeader className="py-2 px-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <IoLocationSharp className="w-4 h-4 text-primary" />
              Shelter Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground font-medium">{flight.shelter_name}</span>
              {flight.voucher_eligible && (
                <Badge className="text-[10px] h-4 px-1 bg-accent/20 text-accent border-0">Voucher Eligible</Badge>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Distance: {flight.shelter_name ? 'Nearby' : 'N/A'}</span>
              {flight.directions_url && (
                <a href={flight.directions_url} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 px-2">
                    <IoNavigate className="w-3 h-3" /> Get Directions
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button size="sm" className="text-xs gap-1 flex-1" onClick={() => onCheckNow(flight.id)} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <IoTime className="w-3 h-3" />}
          Refresh Status
        </Button>
        <Button size="sm" variant="outline" className="text-xs gap-1 flex-1" onClick={() => onSendAlert(flight.flight_number)} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <IoSend className="w-3 h-3" />}
          Send Alert
        </Button>
      </div>

      {flightAlerts.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-2">Notification History ({flightAlerts.length})</h3>
          <ScrollArea className="h-48">
            <div className="space-y-1.5">
              {flightAlerts.map((alert) => (
                <Card key={alert.id} className="border border-border bg-card">
                  <CardContent className="p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`text-[10px] h-4 px-1 border-0 ${getStatusColor(alert.alert_type)}`}>{alert.alert_type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{alert.timestamp}</span>
                      {alert.delivery_status && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 ml-auto">{alert.delivery_status}</Badge>
                      )}
                    </div>
                    {alert.sms_message && <p className="text-[10px] text-foreground truncate">{alert.sms_message}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  )
}
