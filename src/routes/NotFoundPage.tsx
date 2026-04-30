import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFoundPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          The page you requested doesn’t exist.
        </div>
        <Button asChild>
          <Link to="/">Go to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

