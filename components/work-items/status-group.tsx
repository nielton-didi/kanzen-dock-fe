"use client"

import { ChevronRight, Plus } from "lucide-react"
import { cn } from "cn"

import { CreateWorkItemDialog } from "@/components/work-items/create-work-item-dialog"
import { InlineAddWorkItem } from "@/components/work-items/inline-add-work-item"
import { WorkItemRow, WORK_ITEM_ROW_COLUMNS } from "@/components/work-items/work-item-row"
import { STATUS_SWATCH_CLASSNAMES } from "@/components/work-items/work-item-badges"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import type { WorkItem, Status, WorkspaceMember } from "@/lib/types"

export function StatusGroup({
  status,
  statuses,
  workItems,
  workspaceMembers,
  listId,
  onWorkItemOpen,
  open,
  onOpenChange,
  onWorkItemCreated,
  onWorkItemDeleted,
  onWorkItemUpdated,
}: {
  status: Status
  statuses: Status[]
  workItems: WorkItem[]
  workspaceMembers: WorkspaceMember[]
  listId: string
  onWorkItemOpen: (workItemId: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  onWorkItemCreated: (workItem: WorkItem) => void
  onWorkItemDeleted: (workItemId: string) => void
  onWorkItemUpdated: (workItem: WorkItem) => void
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
          <span className="text-xs text-muted-foreground">{workItems.length}</span>
        </CollapsibleTrigger>
        <CreateWorkItemDialog listId={listId} statusId={status.id} onCreated={onWorkItemCreated}>
          <Button variant="ghost" size="icon-sm">
            <Plus />
            <span className="sr-only">Add work item to {status.name}</span>
          </Button>
        </CreateWorkItemDialog>
      </div>
      <CollapsibleContent>
        <div className="flex flex-col py-1.5 pl-10">
          {workItems.length > 0 && (
            <>
              <div
                className={cn(
                  WORK_ITEM_ROW_COLUMNS,
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
                {workItems.map((workItem) => (
                  <WorkItemRow
                    key={workItem.id}
                    workItem={workItem}
                    onOpen={onWorkItemOpen}
                    statuses={statuses}
                    workspaceMembers={workspaceMembers}
                    onDeleted={onWorkItemDeleted}
                    onUpdated={onWorkItemUpdated}
                  />
                ))}
              </div>
            </>
          )}
          <InlineAddWorkItem listId={listId} statusId={status.id} onCreated={onWorkItemCreated} />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
