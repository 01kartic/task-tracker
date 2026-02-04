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
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import * as Icons from "@tabler/icons-react";
import { createIconName } from "./icon-picker/picker";
import IconPicker from "./icon-picker/picker";

interface EditTrackerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tracker: {
    id: string;
    name: string;
    icon?: {
      icon?: string;
      emoji?: string;
      color?: string;
    } | null;
  };
  existingTasks: Array<{ id: string; title: string }>;
  onAddTask: (title: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDeleteTracker: (trackerId: string) => void;
  onUpdateTracker: (updates: {
    name?: string;
    icon?: { icon?: string; emoji?: string; color?: string } | null;
  }) => void;
}

export function EditTrackerDialog({
  isOpen,
  onClose,
  tracker,
  existingTasks,
  onAddTask,
  onDeleteTask,
  onDeleteTracker,
  onUpdateTracker,
}: EditTrackerDialogProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [editName, setEditName] = useState(tracker.name);
  const [editIcon, setEditIcon] = useState<{
    icon?: string;
    emoji?: string;
    color?: string;
  } | null>(tracker.icon || null);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle("");
    }
  };

  const handleOpenEditDetails = () => {
    setEditName(tracker.name);
    setEditIcon(tracker.icon || null);
    setShowEditDetails(true);
  };

  const handleSaveDetails = () => {
    if (editName.trim()) {
      onUpdateTracker({ name: editName.trim(), icon: editIcon });
      setShowEditDetails(false);
    }
  };

  const handleDeleteTracker = () => {
    onDeleteTracker(tracker.id);
    setShowDeleteConfirm(false);
    onClose();
    setShowEditDetails(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPopup showCloseButton={false}>
        <DialogHeader className="flex-row items-center justify-between pr-6">
          <DialogTitle className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Edit Tasks of</span>{" "}
            {tracker.icon?.emoji ? (
              <span className="text-xl leading-none">{tracker.icon.emoji}</span>
            ) : tracker.icon?.icon ? (
              (() => {
                const IconComp = (Icons as any)[
                  createIconName(tracker.icon.icon)
                ];
                return (
                  <IconComp
                    className="size-5"
                    style={{ color: tracker.icon.color }}
                  />
                );
              })()
            ) : null}{" "}
            {tracker.name}
          </DialogTitle>
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={handleOpenEditDetails}
                    />
                  }
                >
                  <Icons.IconPencil />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Edit Tracker Details
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={onClose}
                    />
                  }
                >
                  <Icons.IconX />
                </TooltipTrigger>
                <TooltipContent side="bottom">Close</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
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
        <div className="space-y-2 px-5 py-4 border-t border-dashed">
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
      </DialogPopup>

      {/* Nested Dialog for Editing Tracker Details */}
      <Dialog open={showEditDetails} onOpenChange={setShowEditDetails}>
        <DialogPopup showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>
              <span className="text-muted-foreground">Edit</span> {tracker.name}
              <span className="text-muted-foreground">'s Details</span>
            </DialogTitle>
          </DialogHeader>

          <DialogPanel className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-tracker-name">Tracker Name</Label>
              <div className="flex items-center gap-2">
                <IconPicker value={editIcon} onChange={setEditIcon} />
                <Input
                  id="edit-tracker-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g., Daily Habits"
                />
              </div>
            </div>
          </DialogPanel>

          <DialogFooter
            className="justify-between"
            variant={showDeleteConfirm ? "bare" : "default"}
          >
            {!showDeleteConfirm ? (
              <>
                <Button
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive-outline"
                >
                  Delete Tracker
                </Button>
                <div className="w-full flex justify-end gap-2">
                  <Button
                    onClick={() => setShowEditDetails(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveDetails}
                    disabled={!editName.trim()}
                    variant="default"
                  >
                    Save Changes
                  </Button>
                </div>
              </>
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
                      <TooltipContent>Cancel</TooltipContent>
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
                      <TooltipContent>Confirm Delete</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </AlertAction>
              </Alert>
            )}
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </Dialog>
  );
}
