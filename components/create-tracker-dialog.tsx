"use client";

import { IconPlus, IconX } from "@tabler/icons-react";
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

interface CreateTrackerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, tasks: string[]) => void;
}

export function CreateTrackerDialog({
  isOpen,
  onClose,
  onSubmit,
}: CreateTrackerDialogProps) {
  const [trackerName, setTrackerName] = useState("");
  const [tasks, setTasks] = useState<string[]>([""]);

  if (!isOpen) return null;

  const handleAddTask = () => {
    setTasks([...tasks, ""]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleTaskChange = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    setTasks(newTasks);
  };

  const handleSubmit = () => {
    const validTasks = tasks.filter((t) => t.trim() !== "");
    if (trackerName.trim() && validTasks.length > 0) {
      onSubmit(trackerName.trim(), validTasks);
      setTrackerName("");
      setTasks([""]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPopup showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Create New Tracker</DialogTitle>
        </DialogHeader>

        <DialogPanel className="max-h-96 overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tracker-name">Tracker Name</Label>
              <Input
                id="tracker-name"
                type="text"
                value={trackerName}
                onChange={(e) => setTrackerName(e.target.value)}
                placeholder="e.g., Daily Habits"
              />
            </div>

            <div className="space-y-2">
              <Label>Daily Tasks</Label>
              {tasks.map((task, index) => (
                <div key={index} className="relative">
                  <Input
                    type="text"
                    value={task}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                    placeholder={`Task ${index + 1}`}
                    className="flex-1"
                  />
                  {tasks.length > 1 && (
                    <Button
                      onClick={() => handleRemoveTask(index)}
                      variant="ghost"
                      size="icon-xs"
                      className="absolute end-1 top-1"
                      title="Remove task"
                    >
                      <IconX />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button onClick={handleAddTask} variant="ghost" size="sm">
              <IconPlus />
              Add Task
            </Button>
          </div>
        </DialogPanel>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !trackerName.trim() || tasks.filter((t) => t.trim()).length === 0
            }
            variant="default"
          >
            Create Tracker
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
