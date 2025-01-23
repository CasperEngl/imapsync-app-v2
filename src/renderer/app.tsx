import { Progress } from '@radix-ui/react-progress'
import { ThemeProvider } from '~/renderer/components/theme-provider.js'
import { Button } from '~/renderer/components/ui/button.js'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/renderer/components/ui/card.js'
import { Input } from '~/renderer/components/ui/input.js'

export function App() {
  return (
    <ThemeProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">IMAP Sync App</h1>

        {/* Add Transfer Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add New Transfer</CardTitle>
            <CardDescription>Configure source and destination email servers for sync</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium">Source</h3>
                <Input
                  type="text"
                  placeholder="Host"
                />
                <Input
                  type="text"
                  placeholder="Username"
                />
                <Input
                  type="password"
                  placeholder="Password"
                />
              </div>
              <div className="space-y-4">
                <h3 className="font-medium">Destination</h3>
                <Input
                  type="text"
                  placeholder="Host"
                />
                <Input
                  type="text"
                  placeholder="Username"
                />
                <Input
                  type="password"
                  placeholder="Password"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button>Add Transfer</Button>
          </CardFooter>
        </Card>

        {/* Transfer List */}
        <Card>
          <CardHeader>
            <CardTitle>Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Example transfer item */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Transfer Details</h3>
                  <span className="px-2 py-1 text-sm rounded bg-gray-100">Idle</span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-600">Source</h4>
                    <div>
                      <label className="block text-sm text-gray-500">Host</label>
                      <Input
                        type="text"
                        value="imap.source.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Username</label>
                      <Input
                        type="text"
                        value="user@source.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Password</label>
                      <Input
                        type="password"
                        value="password"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-gray-600">Destination</h4>
                    <div>
                      <label className="block text-sm text-gray-500">Host</label>
                      <Input
                        type="text"
                        value="imap.destination.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Username</label>
                      <Input
                        type="text"
                        value="user@destination.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-500">Password</label>
                      <Input
                        type="password"
                        value="password"
                      />
                    </div>
                  </div>
                </div>

                {/* Progress bar for syncing state */}
                <div className="mb-4">
                  <Progress value={0} />
                  <p className="text-sm text-gray-500 mt-1">Progress message will appear here</p>
                </div>

                <div className="flex gap-2">
                  <Button>Start</Button>
                  <Button variant="destructive">Remove</Button>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </ThemeProvider>
  )
}
