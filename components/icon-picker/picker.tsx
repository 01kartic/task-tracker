"use client";

import { IconCircleDashedPlus } from "@tabler/icons-react";
import { Button } from "../ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import * as Icons from "@tabler/icons-react";
import icons from "@/components/icon-picker/icons.json";
import { Tabs, TabsList, TabsPanel, TabsTab } from "../ui/tabs";
import { ChooseEmoji } from "./emoji";
import ChooseIcons from "./icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const COLUMNS = 8;
const TOGGLE_SIZE = 32;
const GAP = 4;
const PADDING = 20;
const POPOVER_WIDTH = COLUMNS * TOGGLE_SIZE + (COLUMNS - 1) * GAP + 2 * PADDING;

export const createIconName = (data: any) => {
  const i =
    typeof data === "string" ? (icons as Record<string, any>)[data] : data;
  return (
    "Icon" +
    i.name
      .split("-")
      .map((part: string) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("") +
    (i.styles?.filled ? "Filled" : "")
  );
};

export default function IconPicker({
  value,
  onChange,
}: {
  value: { icon?: string; emoji?: string; color?: string } | null;
  onChange: (
    value: { icon?: string; emoji?: string; color?: string } | null,
  ) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="icon"
            className="[&>svg]:size-5!"
            title={`${value ? "Change" : "Add"} Icon or Emoji`}
          />
        }
      >
        {value?.emoji ? (
          <span className="text-xl">{value.emoji}</span>
        ) : value?.icon ? (
          (() => {
            const IconComp =
              (Icons as any)[createIconName(value.icon)] ||
              IconCircleDashedPlus;
            return <IconComp style={{ color: value.color }} />;
          })()
        ) : (
          <IconCircleDashedPlus className="opacity-40" />
        )}
      </PopoverTrigger>
      <PopoverPopup
        align="start"
        sideOffset={8}
        className="[&>div]:p-0 rounded-2xl overflow-hidden"
      >
        <Tabs className="w-full gap-0" style={{ minWidth: POPOVER_WIDTH }}>
          <div className="w-full flex items-center justify-between border-b px-3">
            <TabsList variant="underline" className=" pt-2!">
              <TabsTab value="Icons">Icons</TabsTab>
              <TabsTab value="Emoji">Emoji</TabsTab>
            </TabsList>

            {value && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground -mb-1 -mr-1"
                      onClick={() => onChange(null)}
                    />
                  }
                >
                  <Icons.IconX />
                </TooltipTrigger>
                <TooltipContent side="bottom">Remove {value?.emoji ? "Emoji" : "Icon"}</TooltipContent>
              </Tooltip>
            )}
          </div>
          <TabsPanel value="Icons">
            <ChooseIcons
              icon={value?.icon || null}
              color={value?.color || null}
              onChange={(updates: { icon?: string; color?: string }) =>
                onChange({ ...value, ...updates, emoji: undefined })
              }
            />
          </TabsPanel>
          <TabsPanel value="Emoji">
            <ChooseEmoji
              emoji={value?.emoji || null}
              changeEmoji={(emoji: string) => onChange({ emoji })}
            />
          </TabsPanel>
        </Tabs>
      </PopoverPopup>
    </Popover>
  );
}
