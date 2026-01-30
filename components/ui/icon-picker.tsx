"use client";

import * as React from "react";
import {
    IconBriefcase,
    IconCurrencyDollar,
    IconDeviceMobile,
    IconSchool,
    IconPencil,
    IconLeaf,
    IconCode,
    IconPhoto,
    IconMusic,
    IconTrash,
    IconPizza,
    IconPalette,
    IconPhone,
    IconSettings,
    IconFlower,
    IconCamera,
    IconChartBar,
    IconClock,
    IconTool,
    IconPaw,
    IconFlask,
    IconBallBasketball,
    IconHeart,
    IconCup,
    IconMoodPlus,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverTrigger,
    PopoverPopup,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export const COLORS = [
    { name: "None", value: "none", color: "transparent", border: true },
    { name: "Red", value: "red", color: "#ef4444" },
    { name: "Orange", value: "orange", color: "#f97316" },
    { name: "Yellow", value: "yellow", color: "#eab308" },
    { name: "Green", value: "green", color: "#22c55e" },
    { name: "Blue", value: "blue", color: "#3b82f6" },
    { name: "Purple", value: "purple", color: "#a855f7" },
    { name: "Pink", value: "pink", color: "#ec4899" },
];

export const ICONS = [
    { name: "Briefcase", icon: IconBriefcase },
    { name: "Dollar", icon: IconCurrencyDollar },
    { name: "Mobile", icon: IconDeviceMobile },
    { name: "School", icon: IconSchool },
    { name: "Pencil", icon: IconPencil },
    { name: "Leaf", icon: IconLeaf },
    { name: "Code", icon: IconCode },
    { name: "Photo", icon: IconPhoto },
    { name: "Music", icon: IconMusic },
    { name: "Trash", icon: IconTrash },
    { name: "Pizza", icon: IconPizza },
    { name: "Palette", icon: IconPalette },
    { name: "Phone", icon: IconPhone },
    { name: "Settings", icon: IconSettings },
    { name: "Flower", icon: IconFlower },
    { name: "Camera", icon: IconCamera },
    { name: "Chart", icon: IconChartBar },
    { name: "Clock", icon: IconClock },
    { name: "Tool", icon: IconTool },
    { name: "Paw", icon: IconPaw },
    { name: "Flask", icon: IconFlask },
    { name: "Ball", icon: IconBallBasketball },
    { name: "Heart", icon: IconHeart },
    { name: "Cup", icon: IconCup },
];

interface IconPickerProps {
    selectedColor?: string;
    selectedIcon?: string;
    onColorChange?: (color: string) => void;
    onIconChange?: (icon: string) => void;
}

export function IconPicker({
    selectedColor = "none",
    selectedIcon,
    onColorChange,
    onIconChange,
}: IconPickerProps) {
    const [open, setOpen] = React.useState(false);

    const handleColorSelect = (color: string) => {
        onColorChange?.(color);
    };

    const handleIconSelect = (iconName: string) => {
        onIconChange?.(iconName);
        setOpen(false);
    };

    // Get the selected icon component
    const SelectedIconComponent = selectedIcon
        ? ICONS.find((icon) => icon.name === selectedIcon)?.icon
        : null;

    // Get the selected color value
    const selectedColorValue = COLORS.find(
        (color) => color.value === selectedColor
    )?.color;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-full hover:bg-background dark:hover:bg-zinc-100/10 transition-colors"
                    title="Add icon"
                    style={
                        selectedColor !== "none" && selectedColorValue
                            ? { color: selectedColorValue }
                            : undefined
                    }
                >
                    {SelectedIconComponent ? (
                        <SelectedIconComponent className="h-5 w-5" />
                    ) : (
                        <IconMoodPlus className="h-5 w-5" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverPopup
                side="bottom"
                align="start"
                sideOffset={8}
                className="w-80"
            >
                <div className="space-y-4">
                    {/* Color Picker */}
                    <div className="grid grid-cols-6 gap-2">
                        {COLORS.map((color) => (
                            <button
                                key={color.value}
                                type="button"
                                onClick={() => handleColorSelect(color.value)}
                                className={cn(
                                    "h-6 w-6 rounded-full transition-all hover:scale-110",
                                    selectedColor === color.value &&
                                    "ring-2 ring-offset-2 ring-foreground",
                                    color.border && "border-2 border-border"
                                )}
                                style={{ backgroundColor: color.color }}
                                title={color.name}
                                aria-label={`Select ${color.name} color`}
                            />
                        ))}
                    </div>

                    {/* Separator */}
                    <div className="border-t border-border" />

                    {/* Icon Grid */}
                    <div className="grid grid-cols-6 gap-2">
                        {ICONS.map(({ name, icon: Icon }) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => handleIconSelect(name)}
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-accent",
                                    selectedIcon === name && "bg-accent"
                                )}
                                title={name}
                                aria-label={`Select ${name} icon`}
                            >
                                <Icon className="h-5 w-5" />
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverPopup>
        </Popover>
    );
}
