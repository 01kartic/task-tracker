"use client";

import {
  IconPlus,
  IconX,
  IconTrash,
  IconQuestionMark,
  IconAlertSquareRounded,
  IconCheck,
} from "@tabler/icons-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogPanel,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "./ui/empty";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Tooltip,
  TooltipPopup,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface EditTrackerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tracker: {
    id: string;
    name: string;
  };
  existingTasks: Array<{ id: string; title: string }>;
  onAddTask: (title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteTracker: (trackerId: string) => void;
}

export function EditTrackerDialog({
  isOpen,
  onClose,
  tracker,
  existingTasks,
  onAddTask,
  onDeleteTask,
  onDeleteTracker,
}: EditTrackerDialogProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle("");
    }
  };

  const handleDeleteTracker = () => {
    onDeleteTracker(tracker.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            <span className="text-muted-foreground">Edit</span> {tracker.name}
          </DialogTitle>
        </DialogHeader>

        <DialogPanel>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Current Tasks</Label>
            <div className="space-y-2">
              {existingTasks.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <IconQuestionMark />
                    </EmptyMedia>
                    <EmptyDescription>No tasks yet</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                existingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-1 border rounded-lg"
                  >
                    <span className="text-sm pl-2">{task.title}</span>
                    <Button
                      onClick={() => onDeleteTask(task.id)}
                      variant="ghost"
                      size="icon-xs"
                      className="text-destructive hover:bg-destructive/10"
                      title="Delete task"
                    >
                      <IconTrash />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogPanel>

        <DialogFooter className="flex-col! gap-3">
          <div className="space-y-2">
            <Label htmlFor="new-task">Add New Task</Label>
            <div className="flex gap-2">
              <Button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim()}
                variant="default"
                size="icon"
              >
                <IconPlus />
              </Button>
              <Input
                id="new-task"
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                placeholder="Enter task"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              New tasks will appear from today onwards
            </p>
          </div>
          {!showDeleteConfirm ? (
            <div className="w-full flex justify-end gap-2">
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
              <Button
                onClick={() => setShowDeleteConfirm(true)}
                variant="destructive-outline"
              >
                Delete Tracker
              </Button>
            </div>
          ) : (
            <Alert variant="error" className="my-1">
              <IconAlertSquareRounded />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                Are you sure ? This will delete all tasks and data.
              </AlertDescription>
              <AlertAction className="gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          size="icon-sm"
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(false)}
                        />
                      }
                    >
                      <IconX />
                    </TooltipTrigger>
                    <TooltipPopup>Cancel</TooltipPopup>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          size="icon-sm"
                          variant="destructive"
                          onClick={handleDeleteTracker}
                        />
                      }
                    >
                      <IconCheck />
                    </TooltipTrigger>
                    <TooltipPopup>Confirm Delete</TooltipPopup>
                  </Tooltip>
                </TooltipProvider>
              </AlertAction>
            </Alert>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
