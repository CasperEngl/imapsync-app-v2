import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";
import { Button } from "~/renderer/components/ui/button.js";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/renderer/components/ui/command.js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/renderer/components/ui/popover.js";
import { cn } from "~/renderer/lib/utils.js";

export interface ComboboxProps {
  options: { value: string; label: string }[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  id?: string;
}

export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  id,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState(value || "");
  const [inputValue, setInputValue] = React.useState("");
  const preventReopenRef = React.useRef(false);

  if (value !== undefined && selectedValue !== value) {
    setSelectedValue(value);
  }

  return (
    <Popover
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (isOpen) {
          setInputValue("");
        } else {
          setInputValue(selectedValue);
        }
      }}
      open={open}
    >
      <PopoverTrigger asChild>
        <Button
          aria-expanded={open}
          className={cn(
            "w-[200px] justify-between",
            open && "outline",
            !selectedValue && !open && "text-muted-foreground",
            className,
          )}
          id={id}
          onFocus={() => {
            if (!preventReopenRef.current) {
              setOpen(true);
              setInputValue("");
            }
            preventReopenRef.current = false;
          }}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          role="combobox"
          variant="outline"
        >
          {selectedValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 min-w-[var(--radix-popper-anchor-width)] max-w-[var(--radix-popper-anchor-width)]">
        <Command>
          <CommandInput
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                preventReopenRef.current = true;
                setOpen(false);
              }
              if (e.key === "Tab") {
                preventReopenRef.current = true;
                setOpen(false);
              }
            }}
            onValueChange={(value) => {
              setInputValue(value);
              setSelectedValue(value);
              onValueChange?.(value);
            }}
            placeholder={searchPlaceholder}
            value={inputValue}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue
                ? (
                    <>
                      Press Enter to use "
                      {inputValue}
                      "
                    </>
                  )
                : emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  onSelect={(currentValue) => {
                    preventReopenRef.current = true;
                    setSelectedValue(currentValue);
                    setInputValue(currentValue);
                    onValueChange?.(currentValue);
                    setOpen(false);
                  }}
                  value={option.value}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValue === option.value
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
