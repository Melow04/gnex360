import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, UserStatus, Membership, Plan } from '@prisma/client'
import { format } from 'date-fns'

interface MemberCardProps {
  user: User & {
    membership: (Membership & { plan: Plan }) | null
  }
}

export function MemberCard({ user }: MemberCardProps) {
  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'default'
      case 'INACTIVE':
        return 'secondary'
      case 'BANNED':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>
              {user.firstName} {user.lastName}
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </div>
          <Badge variant={getStatusColor(user.status)}>
            {user.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm">
          <p className="text-muted-foreground">Role</p>
          <p className="font-medium">{user.role}</p>
        </div>
        {user.phone && (
          <div className="text-sm">
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{user.phone}</p>
          </div>
        )}
        {user.membership && (
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="text-sm">
              <p className="text-muted-foreground">Plan</p>
              <p className="font-medium">{user.membership.plan.name}</p>
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Valid Until</p>
              <p className="font-medium">
                {format(new Date(user.membership.endDate), 'MMM dd, yyyy')}
              </p>
            </div>
            <Badge variant={user.membership.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {user.membership.status}
            </Badge>
          </div>
        )}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
          <p>QR Code: {user.qrCode}</p>
        </div>
      </CardContent>
    </Card>
  )
}
