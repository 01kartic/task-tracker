"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { emojiData } from "@/lib/emojis";
import { Input } from "../ui/input";
import {
  IconAppleFilled,
  IconArrowsShuffle,
  IconBallBasketball,
  IconBulbFilled,
  IconCarFilled,
  IconCat,
  IconFlagFilled,
  IconMoodSmileFilled,
  IconSearch,
  IconSortAscendingLetters,
  IconX,
} from "@tabler/icons-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Button } from "../ui/button";
import { Toggle } from "../ui/toggle-group";
import { List, useDynamicRowHeight } from "react-window";

type Emoji = {
  id: string;
  name: string;
  skins: { native: string }[];
  keywords: string[];
};

const CATEGORIES: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> =
  {
    people: {
      label: "Smileys & People",
      icon: IconMoodSmileFilled,
    },
    nature: {
      label: "Animals & Nature",
      icon: IconCat,
    },
    foods: {
      label: "Food & Drink",
      icon: IconAppleFilled,
    },
    activity: {
      label: "Activity",
      icon: IconBallBasketball,
    },
    places: {
      label: "Travel & Places",
      icon: IconCarFilled,
    },
    objects: {
      label: "Objects",
      icon: IconBulbFilled,
    },
    symbols: {
      label: "Symbols",
      icon: IconSortAscendingLetters,
    },
    flags: {
      label: "Flags",
      icon: IconFlagFilled,
    },
  };

const COLUMNS = 8;

export function ChooseEmoji({
  emoji,
  changeEmoji,
}: {
  emoji: string | null;
  changeEmoji: (emoji: string) => void;
}) {
  const [query, setQuery] = useState<string | null>(null);
  const [categories, setCategories] = useState<Record<string, any[]>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const listRef = useRef<any>(null);

  useEffect(() => {
    emojiData().then((data) => {
      setCategories(data);
    });
  }, []);

  const scrollToCategory = (category: string) => {
    const index = allItems.findIndex(
      (it) => it.type === "header" && it.category === category,
    );
    if (index !== -1) {
      listRef.current?.scrollToRow?.({ index, align: "start", behavior: "smooth" });
      setActiveCategory(category);
    }
  };

  const handleRowsRendered = ({ startIndex }: { startIndex: number }) => {
    for (let i = startIndex; i >= 0; i--) {
      const item = allItems[i];
      if (item?.type === "header") {
        if (item.category !== activeCategory) setActiveCategory(item.category);
        break;
      }
    }
  };

  const filterEmojis = useMemo(() => {
    if (!query?.trim()) return categories;
    const lowerQuery = query.toLowerCase();
    const allEmojis = Object.values(categories).flat();
    const filtered = allEmojis.filter((emoji) => {
      const nameMatch = emoji.name.toLowerCase().includes(lowerQuery);
      const keywordsMatch = emoji.keywords.some((kw: string) =>
        kw.toLowerCase().includes(lowerQuery),
      );
      const nativeMatch = emoji.skins[0].native.includes(query);
      return nameMatch || keywordsMatch || nativeMatch;
    });
    return filtered.length ? { Results: filtered } : {};
  }, [query, categories]);

  const allItems = useMemo(() => {
    const items: Array<
      { type: "header"; category: string } | { type: "row"; emojis: Emoji[] }
    > = [];
    Object.entries(filterEmojis).forEach(([category, emojis]) => {
      items.push({ type: "header", category });
      const rows = Math.ceil(emojis.length / COLUMNS);
      for (let r = 0; r < rows; r++) {
        const rowEmojis = emojis.slice(r * COLUMNS, (r + 1) * COLUMNS);
        items.push({ type: "row", emojis: rowEmojis });
      }
    });
    return items;
  }, [filterEmojis]);

  const rowHeight = useDynamicRowHeight({
    defaultRowHeight: 42,
  });

  const EmojiRow = ({
    index,
    style,
    ...rest
  }: {
    index: number;
    style: React.CSSProperties;
  } & any) => {
    const item = allItems[index];
    if (item.type === "header") {
      return (
        <div
          style={style}
          className="text-xs font-medium text-muted-foreground capitalize px-3 py-2"
          data-category={item.category}
        >
          {CATEGORIES[item.category]?.label || item.category}
        </div>
      );
    } else {
      return (
        <div
          style={style}
          className="w-full grid grid-cols-8 gap-1.5 px-2.5 py-0.5"
          {...rest}
        >
          <TooltipProvider>
            {item.emojis.map((emojiItem) => (
              <Tooltip key={emojiItem.id}>
                <TooltipTrigger
                  render={
                    <Toggle
                      value={emojiItem.id}
                      pressed={emoji === emojiItem.skins[0].native}
                      onPressedChange={() => changeEmoji(emojiItem.skins[0].native)}
                    />
                  }
                >
                  <span className="text-2xl">{emojiItem.skins[0].native}</span>
                </TooltipTrigger>
                <TooltipContent>{emojiItem.name}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      );
    }
  };

  const selectRandom = () => {
    return () => {
      const allEmojis = Object.values(categories).flat();
      const randomEmoji =
        allEmojis[Math.floor(Math.random() * allEmojis.length)];
      changeEmoji(randomEmoji.skins[0].native);
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
          <IconSearch className="absolute size-4 start-2.5 top-1/2 -translate-y-1/2 opacity-60" />
          {query && (
            <button
              className="absolute size-6 end-1 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer opacity-60"
              title="clear"
              onClick={() => setQuery(null)}
            >
              <IconX className="size-4" />
            </button>
          )}
        </div>
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
            <IconArrowsShuffle />
          </TooltipTrigger>
          <TooltipContent side="bottom">Random</TooltipContent>
        </Tooltip>
      </div>
      <div className="flex-1">
        {allItems.length === 0 ? (
          <div className="w-full h-87 flex items-center justify-center py-7 opacity-40">
            <span className="text-sm">No emojis found.</span>
          </div>
        ) : (
          <List
            style={{
              height: 300 + (query ? 48 : 0),
              width: "100%",
            }}
            listRef={listRef}
            onRowsRendered={handleRowsRendered}
            rowCount={allItems.length}
            rowHeight={rowHeight}
            rowComponent={EmojiRow}
            rowProps={{}}
          />
        )}
      </div>
      {!query && (
        <div className="flex items-center justify-between p-2 border-t">
          {Object.entries(CATEGORIES).map(([key, { icon: IconComp }]) => (
            <Toggle
              key={key}
              pressed={activeCategory === key}
              onPressedChange={() => scrollToCategory(key)}
            >
              <IconComp className="size-5" />
            </Toggle>
          ))}
        </div>
      )}
    </div>
  );
}
