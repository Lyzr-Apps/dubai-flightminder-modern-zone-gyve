'use client'

import { IoAirplane, IoNotifications, IoSettings, IoTime, IoHome, IoRadio, IoNewspaper } from 'react-icons/io5'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export type ScreenView = 'dashboard' | 'alerts' | 'detail' | 'settings' | 'news'

interface SidebarProps {
  activeView: ScreenView
  onNavigate: (view: ScreenView) => void
  flightCount: number
  alertCount: number
  isConnected: boolean
}

const NAV_ITEMS: { id: ScreenView; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <IoHome className="w-4 h-4" /> },
  { id: 'news', label: 'Official News', icon: <IoNewspaper className="w-4 h-4" /> },
  { id: 'alerts', label: 'Alert History', icon: <IoNotifications className="w-4 h-4" /> },
  { id: 'detail', label: 'Flight Detail', icon: <IoAirplane className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <IoSettings className="w-4 h-4" /> },
]

export default function Sidebar({ activeView, onNavigate, flightCount, alertCount, isConnected }: SidebarProps) {
  return (
    <aside className="w-56 min-h-screen bg-sidebar border-r border-sidebar-border flex flex-col font-sans">
      <div className="px-4 py-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <IoAirplane className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-sidebar-foreground leading-tight">Dubai Flight</h1>
          <p className="text-[10px] text-muted-foreground leading-tight">Monitor & Assist</p>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      <nav className="flex-1 px-2 py-2 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.id}
            variant={activeView === item.id ? 'secondary' : 'ghost'}
            className={`w-full justify-start gap-2 h-8 text-xs font-normal ${activeView === item.id ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent'}`}
            onClick={() => onNavigate(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
            {item.id === 'dashboard' && flightCount > 0 && (
              <Badge variant="secondary" className="ml-auto h-4 px-1 text-[10px] bg-primary/20 text-primary border-0">{flightCount}</Badge>
            )}
            {item.id === 'alerts' && alertCount > 0 && (
              <Badge variant="secondary" className="ml-auto h-4 px-1 text-[10px] bg-destructive/20 text-destructive border-0">{alertCount}</Badge>
            )}
          </Button>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 text-[10px]">
          <IoRadio className="w-3 h-3" />
          <span className="text-muted-foreground">Connection</span>
          <span className={`ml-auto inline-flex items-center gap-1 ${isConnected ? 'text-accent' : 'text-destructive'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-accent' : 'bg-destructive'}`} />
            {isConnected ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] mt-1">
          <IoTime className="w-3 h-3" />
          <span className="text-muted-foreground">Timezone</span>
          <span className="ml-auto text-foreground">Asia/Dubai</span>
        </div>
      </div>

      <div className="px-4 py-2 border-t border-sidebar-border">
        <p className="text-[9px] text-muted-foreground">Agents: 6 total</p>
        <p className="text-[9px] text-muted-foreground">Manager + 3 sub + Notification + News</p>
      </div>
    </aside>
  )
}
