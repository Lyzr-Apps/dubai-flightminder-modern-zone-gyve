'use client'

import React, { useState } from 'react'
import { IoAirplane, IoLocationSharp, IoRefresh, IoAdd, IoWarning, IoCheckmarkCircle, IoCloseCircle, IoSwapHorizontal } from 'react-icons/io5'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Loader2 } from 'lucide-react'

export interface MonitoredFlight {
  id: string
  flight_number: string
  phone: string
  country_code: string
  gps_enabled: boolean
  lat?: number
  lng?: number
  status?: string
  airline?: string
  route?: string
  status_detail?: string
  is_disruption?: boolean
  shelter_name?: string
  voucher_eligible?: boolean
  last_checked?: string
  original_time?: string
  new_time?: string
  verified_source?: string
  directions_url?: string
  notification_payload?: string
}

interface DashboardSectionProps {
  flights: MonitoredFlight[]
  loading: boolean
  activeAgentId: string | null
  onMonitorFlight: (flight: Omit<MonitoredFlight, 'id'>) => void
  onCheckNow: (flightId: string) => void
  onSelectFlight: (flightId: string) => void
  sampleMode: boolean
}

const COUNTRY_CODES = [
  { code: '+971', label: 'UAE +971' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'UK +44' },
  { code: '+91', label: 'IN +91' },
  { code: '+966', label: 'SA +966' },
  { code: '+974', label: 'QA +974' },
]

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

export default function DashboardSection({ flights, loading, activeAgentId, onMonitorFlight, onCheckNow, onSelectFlight, sampleMode }: DashboardSectionProps) {
  const [formData, setFormData] = useState({
    flight_number: '',
    phone: '',
    country_code: '+971',
    gps_enabled: false,
  })
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const handleGpsToggle = (enabled: boolean) => {
    setFormData(prev => ({ ...prev, gps_enabled: enabled }))
    if (enabled && typeof navigator !== 'undefined' && navigator.geolocation) {
      setGpsLoading(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setGpsLoading(false)
        },
        () => {
          setGpsCoords({ lat: 25.2048, lng: 55.2708 })
          setGpsLoading(false)
        },
        { timeout: 5000 }
      )
    } else if (!enabled) {
      setGpsCoords(null)
    }
  }

  const handleSubmit = () => {
    setFormError(null)
    const fn = formData.flight_number.trim().toUpperCase()
    if (!fn) {
      setFormError('Flight number is required')
      return
    }
    if (!formData.phone.trim()) {
      setFormError('Phone number is required')
      return
    }
    onMonitorFlight({
      flight_number: fn,
      phone: formData.phone.trim(),
      country_code: formData.country_code,
      gps_enabled: formData.gps_enabled,
      lat: gpsCoords?.lat,
      lng: gpsCoords?.lng,
      status: 'Monitoring',
    })
    setFormData(prev => ({ ...prev, flight_number: '', phone: '' }))
    setGpsCoords(null)
  }

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Flight Dashboard</h2>
          <p className="text-xs text-muted-foreground">Register and monitor flights from Dubai International</p>
        </div>
        {loading && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>

      <Card className="border border-border bg-card">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <IoAdd className="w-4 h-4 text-primary" />
            Register Flight for Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Flight Number</Label>
              <Input
                placeholder="e.g. EK203"
                value={formData.flight_number}
                onChange={(e) => setFormData(prev => ({ ...prev, flight_number: e.target.value.toUpperCase() }))}
                className="h-8 text-xs bg-input border-border uppercase"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Phone Number</Label>
              <div className="flex gap-1">
                <Select value={formData.country_code} onValueChange={(v) => setFormData(prev => ({ ...prev, country_code: v }))}>
                  <SelectTrigger className="h-8 w-24 text-xs bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map(cc => (
                      <SelectItem key={cc.code} value={cc.code} className="text-xs">{cc.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="5xxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="h-8 text-xs bg-input border-border flex-1"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <IoLocationSharp className="w-3 h-3 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">GPS Location</Label>
              <Switch checked={formData.gps_enabled} onCheckedChange={handleGpsToggle} className="scale-75" />
              {gpsLoading && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
              {gpsCoords && (
                <span className="text-[10px] text-muted-foreground">{gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}</span>
              )}
            </div>
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <IoAirplane className="w-3 h-3" />}
              Monitor Flight
            </Button>
          </div>
          {formError && <p className="text-xs text-destructive">{formError}</p>}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground">Active Flights ({flights.length})</h3>
        </div>

        {flights.length === 0 && !sampleMode && (
          <Card className="border border-border bg-card">
            <CardContent className="py-8 flex flex-col items-center text-center">
              <IoAirplane className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No flights being monitored</p>
              <p className="text-xs text-muted-foreground mt-1">Register a flight above to start tracking</p>
            </CardContent>
          </Card>
        )}

        <ScrollArea className="h-[calc(100vh-420px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {flights.map((flight) => (
              <Card key={flight.id} className="border border-border bg-card cursor-pointer hover:border-primary/40 transition-colors" onClick={() => onSelectFlight(flight.id)}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IoAirplane className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">{flight.flight_number}</span>
                    </div>
                    <Badge className={`text-[10px] h-5 px-1.5 border-0 ${getStatusColor(flight.status)}`}>
                      {flight.status ?? 'Monitoring'}
                    </Badge>
                  </div>
                  {flight.airline && <p className="text-xs text-muted-foreground">{flight.airline}</p>}
                  {flight.route && <p className="text-xs text-muted-foreground">{flight.route}</p>}
                  {flight.status_detail && <p className="text-xs text-foreground mt-1">{flight.status_detail}</p>}

                  {flight.is_disruption && (
                    <div className="flex items-center gap-1 mt-1.5 text-destructive">
                      <IoWarning className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Disruption detected</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                    <span className="text-[10px] text-muted-foreground">
                      {flight.last_checked ? `Checked: ${flight.last_checked}` : 'Not yet checked'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-[10px] gap-1 px-2"
                      onClick={(e) => { e.stopPropagation(); onCheckNow(flight.id) }}
                      disabled={loading && activeAgentId === '69a4de49671c26b86a9ea9dd'}
                    >
                      {loading && activeAgentId === '69a4de49671c26b86a9ea9dd' ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <IoRefresh className="w-3 h-3" />
                      )}
                      Check Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
