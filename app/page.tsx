'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Sidebar, { type ScreenView } from './sections/Sidebar'
import DashboardSection, { type MonitoredFlight } from './sections/DashboardSection'
import AlertHistorySection, { type AlertEntry } from './sections/AlertHistorySection'
import FlightDetailSection from './sections/FlightDetailSection'
import SettingsSection from './sections/SettingsSection'
import NewsSection from './sections/NewsSection'

const MANAGER_AGENT_ID = '69a4de49671c26b86a9ea9dd'
const NOTIFICATION_AGENT_ID = '69a4de3118aa743b7cdb515b'
const NEWS_AGENT_ID = '69a4e7c6f42837c6d016fbe4'

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

const SAMPLE_FLIGHTS: MonitoredFlight[] = [
  { id: '1', flight_number: 'EK203', phone: '501234567', country_code: '+971', gps_enabled: true, lat: 25.2048, lng: 55.2708, status: 'Delayed', airline: 'Emirates', route: 'DXB - JFK', status_detail: 'Delayed by 2 hours due to weather conditions', is_disruption: true, shelter_name: 'Dubai Airport Hotel T3', voucher_eligible: true, last_checked: '2 min ago', original_time: '14:30', new_time: '16:30', verified_source: 'GCAA', directions_url: 'https://maps.google.com', notification_payload: 'Flight EK203 delayed' },
  { id: '2', flight_number: 'FZ501', phone: '509876543', country_code: '+971', gps_enabled: false, status: 'On Time', airline: 'flydubai', route: 'DXB - BOM', status_detail: 'Scheduled departure on time', is_disruption: false, last_checked: '5 min ago', original_time: '22:15', verified_source: 'flydubai Operations' },
  { id: '3', flight_number: 'EY101', phone: '551112233', country_code: '+971', gps_enabled: true, lat: 25.2532, lng: 55.3657, status: 'Cancelled', airline: 'Etihad Airways', route: 'AUH - LHR', status_detail: 'Flight cancelled due to operational reasons', is_disruption: true, shelter_name: 'Premier Inn Abu Dhabi Airport', voucher_eligible: true, last_checked: '1 min ago', original_time: '08:00', verified_source: 'GCAA', directions_url: 'https://maps.google.com' },
]

const SAMPLE_ALERTS: AlertEntry[] = [
  { id: 'a1', alert_reference: 'ALT-001', flight_number: 'EK203', alert_type: 'Delay', sms_message: 'Your flight EK203 DXB-JFK has been delayed to 16:30. Voucher provided for Dubai Airport Hotel.', whatsapp_message: 'Flight EK203 Update: Delayed by 2hrs. New departure: 16:30. Hotel voucher available at Gate B12.', delivery_status: 'Delivered', timestamp: '2024-01-15 14:35', shelter_info: 'Dubai Airport Hotel T3' },
  { id: 'a2', alert_reference: 'ALT-002', flight_number: 'EY101', alert_type: 'Cancellation', sms_message: 'Flight EY101 AUH-LHR has been cancelled. Alternative flights available. Contact support.', delivery_status: 'Delivered', timestamp: '2024-01-15 07:50' },
  { id: 'a3', alert_reference: 'ALT-003', flight_number: 'EK203', alert_type: 'Shelter', sms_message: 'Shelter assigned: Dubai Airport Hotel T3, 0.3km from your location. Voucher eligible.', whatsapp_message: 'Shelter: Dubai Airport Hotel T3. Distance: 0.3km. Directions: maps.google.com', delivery_status: 'Sent', timestamp: '2024-01-15 14:40', shelter_info: 'Dubai Airport Hotel T3 - 0.3km' },
]

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function Page() {
  const [activeView, setActiveView] = useState<ScreenView>('dashboard')
  const [flights, setFlights] = useState<MonitoredFlight[]>([])
  const [alerts, setAlerts] = useState<AlertEntry[]>([])
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [sampleMode, setSampleMode] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [settings, setSettings] = useState({ notification_channel: 'both', phone: '', country_code: '+971', gps_enabled: false })

  useEffect(() => {
    try {
      const stored = localStorage.getItem('dfm_flights')
      if (stored) setFlights(JSON.parse(stored))
      const storedAlerts = localStorage.getItem('dfm_alerts')
      if (storedAlerts) setAlerts(JSON.parse(storedAlerts))
      const storedSettings = localStorage.getItem('dfm_settings')
      if (storedSettings) setSettings(JSON.parse(storedSettings))
    } catch (e) { /* ignore */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('dfm_flights', JSON.stringify(flights)) } catch (e) { /* ignore */ }
  }, [flights])

  useEffect(() => {
    try { localStorage.setItem('dfm_alerts', JSON.stringify(alerts)) } catch (e) { /* ignore */ }
  }, [alerts])

  useEffect(() => {
    try { localStorage.setItem('dfm_settings', JSON.stringify(settings)) } catch (e) { /* ignore */ }
  }, [settings])

  const displayFlights = sampleMode ? SAMPLE_FLIGHTS : flights
  const displayAlerts = sampleMode ? SAMPLE_ALERTS : alerts

  const handleMonitorFlight = useCallback(async (flightData: Omit<MonitoredFlight, 'id'>) => {
    const newFlight: MonitoredFlight = { ...flightData, id: Date.now().toString() }
    setFlights(prev => [...prev, newFlight])
    setLoading(true)
    setActiveAgentId(MANAGER_AGENT_ID)
    setStatusMsg('Contacting Flight Monitor Manager...')
    try {
      const coords = flightData.gps_enabled && flightData.lat ? `${flightData.lat},${flightData.lng}` : '25.2048,55.2708'
      const msg = `Monitor flight ${flightData.flight_number} for user at coordinates ${coords}. Contact: ${flightData.country_code}${flightData.phone}`
      const result = await callAIAgent(msg, MANAGER_AGENT_ID)
      const parsed = parseAgentResponse(result)
      if (parsed) {
        setFlights(prev => prev.map(f => f.id === newFlight.id ? {
          ...f,
          status: parsed?.current_status ?? f.status,
          airline: parsed?.airline ?? f.airline,
          route: parsed?.route ?? f.route,
          status_detail: parsed?.status_detail ?? f.status_detail,
          is_disruption: parsed?.is_disruption ?? f.is_disruption,
          shelter_name: parsed?.shelter_name ?? f.shelter_name,
          voucher_eligible: parsed?.voucher_eligible ?? f.voucher_eligible,
          last_checked: parsed?.last_checked ?? new Date().toLocaleTimeString(),
          original_time: parsed?.original_time ?? f.original_time,
          new_time: parsed?.new_time ?? f.new_time,
          verified_source: parsed?.verified_source ?? f.verified_source,
          directions_url: parsed?.directions_url ?? f.directions_url,
          notification_payload: parsed?.notification_payload ?? f.notification_payload,
        } : f))
        setStatusMsg('Flight status retrieved successfully')
      } else {
        setStatusMsg('Flight registered. Awaiting status update.')
      }
    } catch (e) {
      setStatusMsg('Error contacting agent. Flight registered for manual check.')
    }
    setLoading(false)
    setActiveAgentId(null)
    setTimeout(() => setStatusMsg(null), 4000)
  }, [])

  const handleCheckNow = useCallback(async (flightId: string) => {
    const flight = flights.find(f => f.id === flightId)
    if (!flight) return
    setLoading(true)
    setActiveAgentId(MANAGER_AGENT_ID)
    setStatusMsg(`Checking ${flight.flight_number}...`)
    try {
      const coords = flight.gps_enabled && flight.lat ? `${flight.lat},${flight.lng}` : '25.2048,55.2708'
      const msg = `Check current status of flight ${flight.flight_number}. User at coordinates ${coords}. Contact: ${flight.country_code}${flight.phone}`
      const result = await callAIAgent(msg, MANAGER_AGENT_ID)
      const parsed = parseAgentResponse(result)
      if (parsed) {
        setFlights(prev => prev.map(f => f.id === flightId ? {
          ...f,
          status: parsed?.current_status ?? f.status,
          airline: parsed?.airline ?? f.airline,
          route: parsed?.route ?? f.route,
          status_detail: parsed?.status_detail ?? f.status_detail,
          is_disruption: parsed?.is_disruption ?? f.is_disruption,
          shelter_name: parsed?.shelter_name ?? f.shelter_name,
          voucher_eligible: parsed?.voucher_eligible ?? f.voucher_eligible,
          last_checked: parsed?.last_checked ?? new Date().toLocaleTimeString(),
          original_time: parsed?.original_time ?? f.original_time,
          new_time: parsed?.new_time ?? f.new_time,
          verified_source: parsed?.verified_source ?? f.verified_source,
          directions_url: parsed?.directions_url ?? f.directions_url,
          notification_payload: parsed?.notification_payload ?? f.notification_payload,
        } : f))
        setStatusMsg('Status updated')
      } else {
        setStatusMsg('Could not parse response')
      }
    } catch (e) {
      setStatusMsg('Error checking flight status')
    }
    setLoading(false)
    setActiveAgentId(null)
    setTimeout(() => setStatusMsg(null), 4000)
  }, [flights])

  const handleSendAlert = useCallback(async (flightNumber: string) => {
    const flight = flights.find(f => f.flight_number === flightNumber)
    if (!flight) return
    setLoading(true)
    setActiveAgentId(NOTIFICATION_AGENT_ID)
    setStatusMsg(`Sending alert for ${flightNumber}...`)
    try {
      const msg = `Send disruption alert for flight ${flightNumber}. Status: ${flight.status ?? 'Unknown'}. Detail: ${flight.status_detail ?? 'No detail'}. Shelter: ${flight.shelter_name ?? 'None'}. Contact: ${flight.country_code}${flight.phone}. Channel: ${settings.notification_channel}`
      const result = await callAIAgent(msg, NOTIFICATION_AGENT_ID)
      const parsed = parseAgentResponse(result)
      if (parsed) {
        const newAlert: AlertEntry = {
          id: Date.now().toString(),
          alert_reference: parsed?.alert_reference ?? `ALT-${Date.now()}`,
          flight_number: parsed?.flight_number ?? flightNumber,
          alert_type: parsed?.alert_type ?? 'Disruption',
          sms_message: parsed?.sms_message,
          whatsapp_message: parsed?.whatsapp_message,
          delivery_status: parsed?.delivery_status ?? 'Sent',
          timestamp: parsed?.timestamp ?? new Date().toLocaleString(),
          shelter_info: flight.shelter_name,
        }
        setAlerts(prev => [newAlert, ...prev])
        setStatusMsg('Alert sent successfully')
      } else {
        setStatusMsg('Alert dispatched (no confirmation data)')
      }
    } catch (e) {
      setStatusMsg('Error sending alert')
    }
    setLoading(false)
    setActiveAgentId(null)
    setTimeout(() => setStatusMsg(null), 4000)
  }, [flights, settings])

  const handleSelectFlight = useCallback((flightId: string) => {
    setSelectedFlightId(flightId)
    setActiveView('detail')
  }, [])

  const handleNavigate = useCallback((view: ScreenView) => {
    setActiveView(view)
    if (view !== 'detail') setSelectedFlightId(null)
  }, [])

  const selectedFlight = (sampleMode ? SAMPLE_FLIGHTS : flights).find(f => f.id === selectedFlightId) ?? null

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex font-sans">
        <Sidebar
          activeView={activeView}
          onNavigate={handleNavigate}
          flightCount={displayFlights.length}
          alertCount={displayAlerts.length}
          isConnected={!loading}
        />

        <div className="flex-1 flex flex-col min-h-screen">
          <header className="h-10 border-b border-border bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              {statusMsg && (
                <span className="text-xs text-primary animate-pulse">{statusMsg}</span>
              )}
              {activeAgentId && (
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  Agent: {activeAgentId === MANAGER_AGENT_ID ? 'Manager' : activeAgentId === NEWS_AGENT_ID ? 'News' : 'Notification'}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-[10px] text-muted-foreground">Sample Data</Label>
              <Switch checked={sampleMode} onCheckedChange={setSampleMode} className="scale-75" />
            </div>
          </header>

          {activeView === 'dashboard' && (
            <DashboardSection
              flights={displayFlights}
              loading={loading}
              activeAgentId={activeAgentId}
              onMonitorFlight={handleMonitorFlight}
              onCheckNow={handleCheckNow}
              onSelectFlight={handleSelectFlight}
              sampleMode={sampleMode}
            />
          )}
          {activeView === 'alerts' && (
            <AlertHistorySection alerts={displayAlerts} sampleMode={sampleMode} />
          )}
          {activeView === 'detail' && (
            <FlightDetailSection
              flight={selectedFlight}
              alerts={displayAlerts}
              loading={loading}
              onSendAlert={handleSendAlert}
              onBack={() => handleNavigate('dashboard')}
              onCheckNow={handleCheckNow}
            />
          )}
          {activeView === 'news' && (
            <NewsSection sampleMode={sampleMode} />
          )}
          {activeView === 'settings' && (
            <SettingsSection settings={settings} onUpdateSettings={setSettings} />
          )}

          <footer className="h-8 border-t border-border bg-card flex items-center justify-between px-4">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span>Flight Monitor Manager</span>
              <span className={`inline-flex items-center gap-1 ${activeAgentId === MANAGER_AGENT_ID ? 'text-primary' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeAgentId === MANAGER_AGENT_ID ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                Manager
              </span>
              <span className={`inline-flex items-center gap-1 ${activeAgentId === NOTIFICATION_AGENT_ID ? 'text-primary' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeAgentId === NOTIFICATION_AGENT_ID ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                Notification
              </span>
              <span className={`inline-flex items-center gap-1 ${activeAgentId === NEWS_AGENT_ID ? 'text-primary' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${activeAgentId === NEWS_AGENT_ID ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                News
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground">Dubai International Airport (DXB)</span>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  )
}
