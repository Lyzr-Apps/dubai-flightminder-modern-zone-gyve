'use client'

import React, { useState, useEffect } from 'react'
import { IoSettings, IoCall, IoLogoWhatsapp, IoLocationSharp, IoTime, IoCloudUpload, IoTrash, IoDocument, IoRefresh, IoPlay, IoPause } from 'react-icons/io5'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { listSchedules, pauseSchedule, resumeSchedule, getScheduleLogs, cronToHuman, triggerScheduleNow } from '@/lib/scheduler'
import type { Schedule, ExecutionLog } from '@/lib/scheduler'
import { getDocuments, uploadAndTrainDocument, deleteDocuments } from '@/lib/ragKnowledgeBase'
import type { RAGDocument } from '@/lib/ragKnowledgeBase'

const SCHEDULE_ID = '69a4de4f25d4d77f732fd5d0'
const MANAGER_AGENT_ID = '69a4de49671c26b86a9ea9dd'
const RAG_ID = '69a4ddfbf572c99c0ffc04e0'

interface SettingsData {
  notification_channel: string
  phone: string
  country_code: string
  gps_enabled: boolean
}

interface SettingsSectionProps {
  settings: SettingsData
  onUpdateSettings: (settings: SettingsData) => void
}

export default function SettingsSection({ settings, onUpdateSettings }: SettingsSectionProps) {
  const [localSettings, setLocalSettings] = useState<SettingsData>(settings)
  const [scheduleId, setScheduleId] = useState(SCHEDULE_ID)
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [schedLoading, setSchedLoading] = useState(false)
  const [schedError, setSchedError] = useState<string | null>(null)
  const [schedSuccess, setSchedSuccess] = useState<string | null>(null)

  const [docs, setDocs] = useState<RAGDocument[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docsError, setDocsError] = useState<string | null>(null)
  const [docsSuccess, setDocsSuccess] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  useEffect(() => {
    loadSchedule()
    loadDocs()
  }, [])

  const loadSchedule = async () => {
    setSchedLoading(true)
    setSchedError(null)
    try {
      const res = await listSchedules({ agentId: MANAGER_AGENT_ID })
      if (res.success && Array.isArray(res.schedules)) {
        const found = res.schedules.find(s => s.id === scheduleId)
        if (found) {
          setSchedule(found)
        } else if (res.schedules.length > 0) {
          setSchedule(res.schedules[0])
          setScheduleId(res.schedules[0].id)
        }
      }
      const logsRes = await getScheduleLogs(scheduleId, { limit: 10 })
      if (logsRes.success && Array.isArray(logsRes.executions)) {
        setLogs(logsRes.executions)
      }
    } catch (e) {
      setSchedError('Failed to load schedule')
    }
    setSchedLoading(false)
  }

  const handleToggleSchedule = async () => {
    setSchedLoading(true)
    setSchedError(null)
    setSchedSuccess(null)
    try {
      if (schedule?.is_active) {
        await pauseSchedule(scheduleId)
        setSchedSuccess('Schedule paused')
      } else {
        await resumeSchedule(scheduleId)
        setSchedSuccess('Schedule activated')
      }
      await loadSchedule()
    } catch (e) {
      setSchedError('Failed to toggle schedule')
    }
    setSchedLoading(false)
  }

  const handleTriggerNow = async () => {
    setSchedLoading(true)
    setSchedError(null)
    setSchedSuccess(null)
    try {
      const res = await triggerScheduleNow(scheduleId)
      if (res.success) {
        setSchedSuccess('Schedule triggered manually')
      } else {
        setSchedError(res.error ?? 'Failed to trigger')
      }
      await loadSchedule()
    } catch (e) {
      setSchedError('Failed to trigger schedule')
    }
    setSchedLoading(false)
  }

  const loadDocs = async () => {
    setDocsLoading(true)
    setDocsError(null)
    try {
      const res = await getDocuments(RAG_ID)
      if (res.success && Array.isArray(res.documents)) {
        setDocs(res.documents)
      }
    } catch (e) {
      setDocsError('Failed to load documents')
    }
    setDocsLoading(false)
  }

  const handleUploadDoc = async () => {
    if (!uploadFile) return
    setDocsLoading(true)
    setDocsError(null)
    setDocsSuccess(null)
    try {
      const res = await uploadAndTrainDocument(RAG_ID, uploadFile)
      if (res.success) {
        setDocsSuccess(`Uploaded: ${uploadFile.name}`)
        setUploadFile(null)
        await loadDocs()
      } else {
        setDocsError(res.error ?? 'Upload failed')
      }
    } catch (e) {
      setDocsError('Upload failed')
    }
    setDocsLoading(false)
  }

  const handleDeleteDoc = async (fileName: string) => {
    setDocsLoading(true)
    setDocsError(null)
    try {
      const res = await deleteDocuments(RAG_ID, [fileName])
      if (res.success) {
        setDocsSuccess(`Deleted: ${fileName}`)
        await loadDocs()
      } else {
        setDocsError(res.error ?? 'Delete failed')
      }
    } catch (e) {
      setDocsError('Delete failed')
    }
    setDocsLoading(false)
  }

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings)
  }

  return (
    <div className="flex-1 p-4 space-y-3 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-xs text-muted-foreground">Configure notifications, schedule, and knowledge base</p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="bg-secondary h-8">
          <TabsTrigger value="notifications" className="text-xs h-6">Notifications</TabsTrigger>
          <TabsTrigger value="schedule" className="text-xs h-6">Schedule</TabsTrigger>
          <TabsTrigger value="knowledge" className="text-xs h-6">Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="mt-3 space-y-3">
          <Card className="border border-border bg-card">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Channel</Label>
                <Select value={localSettings.notification_channel} onValueChange={(v) => setLocalSettings(prev => ({ ...prev, notification_channel: v }))}>
                  <SelectTrigger className="h-8 text-xs bg-input border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms" className="text-xs"><span className="flex items-center gap-1"><IoCall className="w-3 h-3" /> SMS</span></SelectItem>
                    <SelectItem value="whatsapp" className="text-xs"><span className="flex items-center gap-1"><IoLogoWhatsapp className="w-3 h-3" /> WhatsApp</span></SelectItem>
                    <SelectItem value="both" className="text-xs">Both SMS & WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Phone Number</Label>
                <div className="flex gap-1">
                  <Select value={localSettings.country_code} onValueChange={(v) => setLocalSettings(prev => ({ ...prev, country_code: v }))}>
                    <SelectTrigger className="h-8 w-24 text-xs bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="+971" className="text-xs">UAE +971</SelectItem>
                      <SelectItem value="+1" className="text-xs">US +1</SelectItem>
                      <SelectItem value="+44" className="text-xs">UK +44</SelectItem>
                      <SelectItem value="+91" className="text-xs">IN +91</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={localSettings.phone} onChange={(e) => setLocalSettings(prev => ({ ...prev, phone: e.target.value }))} className="h-8 text-xs bg-input border-border flex-1" placeholder="5xxxxxxxx" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IoLocationSharp className="w-3 h-3 text-muted-foreground" />
                  <Label className="text-xs text-muted-foreground">GPS Auto-detect</Label>
                </div>
                <Switch checked={localSettings.gps_enabled} onCheckedChange={(v) => setLocalSettings(prev => ({ ...prev, gps_enabled: v }))} className="scale-75" />
              </div>
              <Button size="sm" className="w-full text-xs h-7" onClick={handleSaveSettings}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="mt-3 space-y-3">
          <Card className="border border-border bg-card">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IoTime className="w-4 h-4 text-primary" />
                Flight Monitor Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-3">
              {schedError && <p className="text-xs text-destructive">{schedError}</p>}
              {schedSuccess && <p className="text-xs text-accent">{schedSuccess}</p>}

              <div className="flex items-center justify-between p-2 rounded bg-secondary/50">
                <div>
                  <p className="text-xs font-medium text-foreground">
                    Status: {schedule?.is_active ? 'Active' : 'Paused'}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {schedule?.cron_expression ? cronToHuman(schedule.cron_expression) : 'Loading...'}
                  </p>
                </div>
                <Badge className={`border-0 text-[10px] ${schedule?.is_active ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}`}>
                  {schedule?.is_active ? 'ACTIVE' : 'PAUSED'}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className={`flex-1 text-xs h-8 gap-1 ${schedule?.is_active ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : 'bg-accent hover:bg-accent/90 text-accent-foreground'}`}
                  onClick={handleToggleSchedule}
                  disabled={schedLoading}
                >
                  {schedLoading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : schedule?.is_active ? (
                    <IoPause className="w-3 h-3" />
                  ) : (
                    <IoPlay className="w-3 h-3" />
                  )}
                  {schedule?.is_active ? 'Pause Schedule' : 'Activate Schedule'}
                </Button>
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1" onClick={handleTriggerNow} disabled={schedLoading}>
                  <IoPlay className="w-3 h-3" /> Run Now
                </Button>
              </div>

              {schedule?.next_run_time && (
                <p className="text-[10px] text-muted-foreground">
                  Next run: {new Date(schedule.next_run_time).toLocaleString()}
                </p>
              )}
              {schedule?.last_run_at && (
                <p className="text-[10px] text-muted-foreground">
                  Last run: {new Date(schedule.last_run_at).toLocaleString()}
                  {schedule.last_run_success !== null && (
                    <span className={schedule.last_run_success ? ' text-accent' : ' text-destructive'}>
                      {schedule.last_run_success ? ' (Success)' : ' (Failed)'}
                    </span>
                  )}
                </p>
              )}

              <Separator className="bg-border" />

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-medium text-foreground">Run History</h4>
                  <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-1 px-1" onClick={loadSchedule} disabled={schedLoading}>
                    <IoRefresh className="w-3 h-3" /> Refresh
                  </Button>
                </div>
                {logs.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-2">No executions yet</p>
                ) : (
                  <ScrollArea className="h-36">
                    <div className="space-y-1">
                      {logs.map((log) => (
                        <div key={log.id} className="flex items-center gap-2 p-1.5 rounded bg-secondary/30 text-[10px]">
                          <Badge className={`h-4 px-1 text-[9px] border-0 ${log.success ? 'bg-accent/20 text-accent' : 'bg-destructive/20 text-destructive'}`}>
                            {log.success ? 'OK' : 'FAIL'}
                          </Badge>
                          <span className="text-muted-foreground flex-1 truncate">{new Date(log.executed_at).toLocaleString()}</span>
                          <span className="text-muted-foreground">Attempt {log.attempt}/{log.max_attempts}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge" className="mt-3 space-y-3">
          <Card className="border border-border bg-card">
            <CardHeader className="py-2 px-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IoDocument className="w-4 h-4 text-primary" />
                Knowledge Base
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 space-y-3">
              <p className="text-[10px] text-muted-foreground">Flight data documents for the Official Source Agent</p>

              {docsError && <p className="text-xs text-destructive">{docsError}</p>}
              {docsSuccess && <p className="text-xs text-accent">{docsSuccess}</p>}

              <div className="flex gap-1">
                <Input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  className="h-7 text-[10px] bg-input border-border flex-1"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
                <Button size="sm" className="h-7 text-xs gap-1" onClick={handleUploadDoc} disabled={docsLoading || !uploadFile}>
                  {docsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <IoCloudUpload className="w-3 h-3" />}
                  Upload
                </Button>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-medium text-foreground">Documents ({docs.length})</h4>
                  <Button size="sm" variant="ghost" className="h-5 text-[10px] gap-1 px-1" onClick={loadDocs} disabled={docsLoading}>
                    <IoRefresh className="w-3 h-3" /> Refresh
                  </Button>
                </div>
                {docs.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground py-2">No documents uploaded</p>
                ) : (
                  <ScrollArea className="h-36">
                    <div className="space-y-1">
                      {docs.map((doc, idx) => (
                        <div key={doc.id ?? idx} className="flex items-center gap-2 p-1.5 rounded bg-secondary/30 text-[10px]">
                          <IoDocument className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground flex-1 truncate">{doc.fileName}</span>
                          <Badge variant="outline" className="text-[9px] h-4 px-1">{doc.fileType}</Badge>
                          <Button size="sm" variant="ghost" className="h-5 w-5 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteDoc(doc.fileName)}>
                            <IoTrash className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
