import type { PropsWithChildren, ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { PageContainer, SectionHeader } from '@/components/layout/PageLayout'

type Props = PropsWithChildren<{
  title: string
  description?: string
  right?: ReactNode
  className?: string
}>

export function PageShell({ title, description, right, className, children }: Props) {
  return (
    <PageContainer className={cn('space-y-6', className)}>
      <SectionHeader title={title} subtitle={description} actions={right} />
      {children}
    </PageContainer>
  )
}

