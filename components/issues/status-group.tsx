"use client"

import { ChevronRight, Plus } from "lucide-react"
import { cn } from "cn"

import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import { InlineAddIssue } from "@/components/issues/inline-add-issue"
import { IssueRow, ISSUE_ROW_COLUMNS } from "@/components/issues/issue-row"
import { STATUS_SWATCH_CLASSNAMES } from "@/components/issues/issue-badges"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { Issue, Status, WorkspaceMember } from "@/lib/types"

export function StatusGroup({
  status,
  statuses,
  issues,
  workspaceMembers,
  listId,
  projectId,
  open,
  onOpenChange,
  onIssueCreated,
  onIssueDeleted,
  onIssueUpdated,
}: {
  status: Status
  statuses: Status[]
  issues: Issue[]
  workspaceMembers: WorkspaceMember[]
  listId: string
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onIssueCreated: (issue: Issue) => void
  onIssueDeleted: (issueId: string) => void
  onIssueUpdated: (issue: Issue) => void
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="group/collapsible">
      <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1.5">
        <CollapsibleTrigger
          render={
            <button
              type="button"
              className="flex flex-1 items-center gap-2 text-left"
            />
          }
        >
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-open/collapsible:rotate-90" />
          <span
            className={cn("size-2 shrink-0 rounded-full", STATUS_SWATCH_CLASSNAMES[status.color])}
          />
          <span className="text-sm font-medium">{status.name}</span>
          <span className="text-xs text-muted-foreground">{issues.length}</span>
        </CollapsibleTrigger>
        <CreateIssueDialog listId={listId} statusId={status.id} onCreated={onIssueCreated}>
          <Button variant="ghost" size="icon-sm">
            <Plus />
            <span className="sr-only">Add issue to {status.name}</span>
          </Button>
        </CreateIssueDialog>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col py-1.5 pl-10">
          {issues.length > 0 && (
            <>
              <div
                className={cn(
                  ISSUE_ROW_COLUMNS,
                  "px-2 pb-1 text-xs font-medium text-muted-foreground"
                )}
              >
                <span />
                <span>Name</span>
                <span className="justify-self-center">Type</span>
                <span className="justify-self-center">Status</span>
                <span className="justify-self-center">Severity</span>
                <span className="justify-self-center">Priority</span>
                <span className="justify-self-center">Assignee</span>
                <span />
              </div>
              <div className="flex flex-col divide-y divide-border/60">
                {issues.map((issue) => (
                  <IssueRow
                    key={issue.id}
                    issue={issue}
                    href={`/projects/${projectId}/lists/${listId}/issues/${issue.id}`}
                    statuses={statuses}
                    workspaceMembers={workspaceMembers}
                    onDeleted={onIssueDeleted}
                    onUpdated={onIssueUpdated}
                  />
                ))}
              </div>
            </>
          )}
          <InlineAddIssue listId={listId} statusId={status.id} onCreated={onIssueCreated} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
