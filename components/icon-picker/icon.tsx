import { useMemo, useState } from "react";
import { Input } from "../ui/input";
import * as Icons from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Popover, PopoverPopup, PopoverTrigger } from "../ui/popover";
import { List, useDynamicRowHeight } from "react-window";
import { Toggle } from "../ui/toggle-group";
import icons from "@/components/icon-picker/icons.json";
import colors from "@/components/icon-picker/colors.json";
import { createIconName } from "./picker";

type Icon = {
  name: string;
  category: string;
  tags?: string[];
  styles?: { filled?: boolean };
};

const COLUMNS = 8;

export default function ChooseIcons({
  icon,
  color,
  onChange,
}: {
  icon: string | null;
  color: string | null;
  onChange: (updates: { icon?: string; color?: string }) => void;
}) {
  const [query, setQuery] = useState<string | null>(null);
  const [tempColor, setTempColor] = useState<string | null>(color);

  const categories = useMemo(() => {
    const result: Record<string, Icon[]> = {};
    Object.values(icons).forEach((icon: any) => {
      if (!result[icon.category]) {
        result[icon.category] = [];
      }
      result[icon.category].push(icon);
    });

    const sortedResult: Record<string, Icon[]> = {};
    Object.keys(result)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        sortedResult[key] = result[key];
      });
    return sortedResult;
  }, []);

  const filteredIcons = useMemo(() => {
    if (!query?.trim()) return categories;
    const search = query.toLowerCase();
    const allIcons: Icon[] = Object.values(categories).flat();
    const filtered = allIcons.filter((icon: any) => {
      if (icon.name.toLowerCase().includes(search)) return true;
      if (Array.isArray(icon.tags)) {
        return icon.tags.some((tag: any) =>
          String(tag).toLowerCase().includes(search),
        );
      }
      return false;
    });
    return filtered.length ? { Results: filtered } : {};
  }, [query, categories]);

  const allItems = useMemo(() => {
    const items: Array<
      { type: "header"; category: string } | { type: "row"; icons: Icon[] }
    > = [];
    Object.entries(filteredIcons).forEach(([category, icons]) => {
      items.push({ type: "header", category });
      const rows = Math.ceil(icons.length / COLUMNS);
      for (let r = 0; r < rows; r++) {
        const rowIcons = icons.slice(r * COLUMNS, (r + 1) * COLUMNS);
        items.push({ type: "row", icons: rowIcons });
      }
    });
    return items;
  }, [filteredIcons]);

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 42,
  });

  const IconRow = (props: any) => {
    const { index, style, ariaAttributes, icon, tempColor, color, onChange } =
      props;
    const item = allItems[index];
    if (item.type === "header") {
      return (
        <div
          style={style}
          className="text-xs font-medium text-muted-foreground px-4 py-2"
          {...ariaAttributes}
        >
          {item.category}
        </div>
      );
    } else {
      return (
        <div
          style={style}
          className="w-full grid grid-cols-8 gap-1.5 px-2.5 py-0.5"
          {...ariaAttributes}
        >
          <TooltipProvider>
            {item.icons.map((i: Icon) => {
              const IconComponent = (Icons as any)[createIconName(i)];
              return (
                <Tooltip key={i.name}>
                  <TooltipTrigger
                    render={
                      <Toggle
                        value={i.name}
                        pressed={icon === i.name}
                        onPressedChange={() => {
                          onChange({
                            icon: i.name,
                            ...(tempColor ? { color: tempColor } : {}),
                          });
                        }}
                        defaultPressed={icon === i.name}
                        className="w-full aspect-square flex"
                      />
                    }
                  >
                    {IconComponent ? (
                      <IconComponent
                        className="size-5"
                        style={{ color: tempColor ?? color }}
                      />
                    ) : null}
                  </TooltipTrigger>
                  <TooltipContent>{i.name}</TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
      );
    }
  };

  const selectRandom = () => {
    const allIcons: Icon[] = Object.values(categories).flat();
    const randomIcon =
      allIcons[Math.floor(Math.random() * allIcons.length)].name;
    const randomColor = colors[Math.floor(Math.random() * colors.length)].value;
    return () => {
      onChange({ icon: randomIcon, color: randomColor });
      setTempColor(randomColor);
    };
  };
  return (
    <div className="w-full flex flex-col">
      <div className="sticky top-0 z-10 flex items-center gap-2 bg-popover p-2">
        <div className="relative flex-1">
          <Input
            value={query || ""}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-input/40 border-none pl-5.5 shadow-none before:shadow-none"
            placeholder="Search"
          />
          <Icons.IconSearch className="absolute size-4 start-2.5 top-1/2 -translate-y-1/2 opacity-60" />
          {query && (
            <button
              className="absolute size-6 end-1 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer opacity-60"
              title="clear"
              onClick={() => setQuery(null)}
            >
              <Icons.IconX className="size-4" />
            </button>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  onClick={selectRandom()}
                />
              }
            >
              <Icons.IconArrowsShuffle />
            </TooltipTrigger>
            <TooltipContent side="bottom">Random</TooltipContent>
          </Tooltip>
          <Popover>
            <Tooltip>
              <PopoverTrigger
                render={
                  <TooltipTrigger
                    render={<Button variant="outline" size="icon" />}
                  />
                }
              >
                <span
                  className="size-3 rounded"
                  style={{
                    backgroundColor: tempColor ?? color ?? "var(--foreground)",
                  }}
                />
              </PopoverTrigger>
              <TooltipContent side="bottom">Select Color</TooltipContent>
            </Tooltip>
            <PopoverPopup
              align="start"
              sideOffset={8}
              className="[&>div]:p-1.5 rounded-xl"
            >
              <div className="grid grid-cols-6 gap-1">
                <TooltipProvider>
                  {colors.map(({ name, value }) => (
                    <Tooltip key={name}>
                      <TooltipTrigger
                        render={
                          <button
                            onClick={() => {
                              setTempColor(value);
                            }}
                            className="size-6 rounded-md transition-all hover:scale-105 outline-2 -outline-offset-4"
                            style={{
                              backgroundColor: value,
                              outlineColor:
                                (tempColor ?? color) === value
                                  ? "var(--background)"
                                  : "transparent",
                            }}
                          />
                        }
                      />
                      <TooltipContent>{name}</TooltipContent>
                    </Tooltip>
                  ))}
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => {
                            setTempColor(null);
                            if (icon) {
                              onChange({ color: undefined });
                            }
                          }}
                          className="size-6"
                        >
                          <Icons.IconX />
                        </Button>
                      }
                    />
                    <TooltipContent>Remove Color</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </PopoverPopup>
          </Popover>
        </TooltipProvider>
      </div>
      {allItems.length === 0 ? (
        <div className="w-full h-87 flex items-center justify-center py-7 opacity-40">
          <span className="text-sm">No icons found.</span>
        </div>
      ) : (
        <List
          style={{
            height: 348,
            width: "100%",
            paddingBottom: 8,
          }}
          rowCount={allItems.length}
          rowHeight={rowHeight}
          rowProps={{
            icon,
            tempColor,
            color,
            onChange,
          }}
          rowComponent={IconRow}
        />
      )}
    </div>
  );
}
