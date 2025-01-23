import { useSelector } from '@xstate/store/react'
import { nanoid } from 'nanoid'
import { useState } from 'react'
import { ThemeProvider } from '~/renderer/components/theme-provider.js'
import { TransferBadge } from '~/renderer/components/transfer-badge.js'
import { Badge } from '~/renderer/components/ui/badge.js'
import { Button } from '~/renderer/components/ui/button.js'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/renderer/components/ui/card.js'
import { Input } from '~/renderer/components/ui/input.js'
import { Progress } from '~/renderer/components/ui/progress.js'
import { store } from './store.js'

export function App() {
  const transfers = useSelector(store, (snapshot) => snapshot.context.transfers)
  const isDemoMode = useSelector(store, (snapshot) => snapshot.context.isDemoMode)
  const [newTransfer, setNewTransfer] = useState({
    source: { host: '', user: '', password: '' },
    destination: { host: '', user: '', password: '' }
  })

  const handleAddTransfer = () => {
    const id = nanoid()
    store.send({
      type: 'addTransfer',
      id,
      source: newTransfer.source,
      destination: newTransfer.destination
    })
    // Reset form
    setNewTransfer({
      source: { host: '', user: '', password: '' },
      destination: { host: '', user: '', password: '' }
    })
  }

  const handleStartTransfer = (id: string) => {
    store.send({ type: 'startTransfer', id })
  }

  const handleRemoveTransfer = (id: string) => {
    store.send({ type: 'removeTransfer', id })
  }

  const handleSourceChange = (field: string, value: string) => {
    setNewTransfer(prev => ({
      ...prev,
      source: { ...prev.source, [field]: value }
    }))
  }

  const handleDestinationChange = (field: string, value: string) => {
    setNewTransfer(prev => ({
      ...prev,
      destination: { ...prev.destination, [field]: value }
    }))
  }

  return (
    <ThemeProvider>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">IMAP Sync App</h1>
          <div className="flex items-center gap-2">
            <Badge variant={isDemoMode ? "warning" : "destructive"} size="lg">
              {isDemoMode ? 'Demo Mode' : 'Live Mode'}
            </Badge>
          </div>
        </div>

        <div className="@container">
          <div className="grid @4xl:grid-cols-5 gap-6 items-start">
            {/* Add Transfer Form */}
            <Card className="sticky top-6 @4xl:col-span-2">
              <CardHeader>
                <CardTitle>Configure New Email Transfer</CardTitle>
                <CardDescription>Set up a new email synchronization by entering the source and destination server details below</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="@container/form">
                  <div className="grid @lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-medium">Source</h3>
                      <Input
                        type="text"
                        placeholder="Host"
                        value={newTransfer.source.host}
                        onChange={(e) => handleSourceChange('host', e.target.value)}
                      />
                      <Input
                        type="text"
                        placeholder="Username"
                        value={newTransfer.source.user}
                        onChange={(e) => handleSourceChange('user', e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={newTransfer.source.password}
                        onChange={(e) => handleSourceChange('password', e.target.value)}
                      />
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-medium">Destination</h3>
                      <Input
                        type="text"
                        placeholder="Host"
                        value={newTransfer.destination.host}
                        onChange={(e) => handleDestinationChange('host', e.target.value)}
                      />
                      <Input
                        type="text"
                        placeholder="Username"
                        value={newTransfer.destination.user}
                        onChange={(e) => handleDestinationChange('user', e.target.value)}
                      />
                      <Input
                        type="password"
                        placeholder="Password"
                        value={newTransfer.destination.password}
                        onChange={(e) => handleDestinationChange('password', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleAddTransfer}>Add Transfer</Button>
              </CardFooter>
            </Card>

            {/* Transfer List */}
            <Card className="@4xl:col-span-3">
              <CardHeader>
                <CardTitle>Existing Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {transfers.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    No transfers added yet. Configure a new transfer to get started.
                  </div>
                ) : (
                  transfers.map((transfer, index) => (
                    <div key={transfer.id}>
                      {index > 0 && <div className="h-px bg-border my-6" />}
                      <div className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="font-medium">Transfer Details</h3>
                          <TransferBadge status={transfer.status} />
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-4">
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-gray-600">Source</h4>
                            <div>
                              <label className="block text-sm text-gray-500">Host</label>
                              <Input
                                type="text"
                                value={transfer.source.host}
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-500">Username</label>
                              <Input
                                type="text"
                                value={transfer.source.user}
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-500">Password</label>
                              <Input
                                type="password"
                                value={transfer.source.password}
                                readOnly
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-gray-600">Destination</h4>
                            <div>
                              <label className="block text-sm text-gray-500">Host</label>
                              <Input
                                type="text"
                                value={transfer.destination.host}
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-500">Username</label>
                              <Input
                                type="text"
                                value={transfer.destination.user}
                                readOnly
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-500">Password</label>
                              <Input
                                type="password"
                                value={transfer.destination.password}
                                readOnly
                              />
                            </div>
                          </div>
                        </div>

                        {/* Progress bar for syncing state */}
                        <div className="mb-4">
                          <Progress
                            value={transfer.progress ? (transfer.progress.current / transfer.progress.total) * 100 : 0}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {transfer.progress?.message || 'No progress to show'}
                            {transfer.error && <span className="text-red-500"> Error: {transfer.error}</span>}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {transfer.status === 'idle' && (
                            <Button onClick={() => handleStartTransfer(transfer.id)}>Start</Button>
                          )}
                          <Button
                            variant="destructive"
                            onClick={() => handleRemoveTransfer(transfer.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ThemeProvider>
  )
}
