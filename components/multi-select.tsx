import * as React from "react";
import {
  CheckIcon,
  ChevronDown,
  XIcon,
  WandSparkles,
  SlidersHorizontal,
  RotateCw,
  LoaderCircle,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMediaQuery } from "@react-hook/media-query";
import SimpleBar from "simplebar-react";
import { Portal } from "@radix-ui/react-popover"
import { Input } from "./ui/input";

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  options: {
    label: React.ReactNode | string;
    value?: string;
    tooltip?: React.ReactNode;
    default?: boolean;
  }[];
  onValueChange: (value: string[]) => void;
  defaultValue?: string[];
  placeholder?: string;
  animation?: number;
  maxCount?: number;
  modalPopover?: boolean;
  className?: string;
  autoClose?: boolean;
  searchable?: boolean;
  valueQuery?: string;
  clearable?: boolean;
  label?: React.ReactNode | string;
  searchValue?: string | undefined;
  onSearchChange?: (value: string) => void;
  handleScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  invalid?: boolean;
  icon?: boolean;
  hideRefresh?: boolean;
  loading?: boolean;
  error?: string | boolean | null;
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      icon = true,
      options,
      onValueChange,
      defaultValue = [],
      placeholder = "Select options",
      animation = 0,
      maxCount = 10,
      modalPopover = false,
      className,
      searchable = false,
      autoClose = false,
      valueQuery = "only screen and (min-width: 0px)",
      clearable = true,
      label,
      searchValue = "",
      onSearchChange,
      handleScroll,
      invalid = false,
      hideRefresh = false,
      loading = false,
      error = false,
      ...props
    },
    ref
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
    const [isAnimating, setIsAnimating] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const mediaMatch = useMediaQuery(valueQuery || "");
    const showValue = valueQuery ? mediaMatch : false;

    const handleInputKeyDown = (
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (event.key === "Enter") {
        setIsPopoverOpen(true);
      } else if (event.key === "Backspace" && !event.currentTarget.value) {
        const newSelectedValues = [...selectedValues];
        newSelectedValues.pop();
        setSelectedValues(newSelectedValues);
        onValueChange(newSelectedValues);
      }
    };

    const toggleOption = (option: string) => {
      const newSelectedValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      setSelectedValues([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev);
    };

    return (
      <Popover
        open={isPopoverOpen}
        onOpenChange={setIsPopoverOpen}
        modal={modalPopover}
      >
        <PopoverTrigger asChild aria-invalid={invalid}>
          <Button
            ref={ref}
            {...props}
            onClick={handleTogglePopover}
            className={cn(
              "lg:min-w-[200px] text-xs sm:text-sm relative flex p-1 rounded-md border border-input h-full items-center justify-between bg-inherit hover:bg-inherit dark:hover:bg-input/50 [&_svg]:pointer-events-auto",
              className
            )}
          >
            {loading ? (
              <div className="mx-2 my-1 justify-start w-full text-muted-foreground flex items-center gap-2.5">
                <LoaderCircle className="animate-spin text-muted-foreground" /> Loading...
              </div>
            ) : error ? (
              <div className="mx-2 my-1 justify-start w-full flex items-center gap-2.5 text-destructive">
                <X className="text-destructive" />
                {error}
              </div>) : <>
              {icon &&
                <SlidersHorizontal className="text-muted-foreground absolute left-3" />
              }
              {selectedValues.length > 0 ? (
                <div className="flex gap-2 justify-between items-center w-full">
                  <div className={`${icon ? "ml-6.5" : "ml-2"} flex flex-wrap items-center font-normal text-foreground`}>
                    {selectedValues.slice(0, maxCount).length} {showValue && "Selected"}
                  </div>
                  <div className="flex items-center justify-between">
                    <XIcon
                      className={cn("h-4 mx-2 cursor-pointer transition-all text-muted-foreground opacity-50", props.disabled ? "hover:text-muted-foreground hover:opacity-50" : "hover:opacity-100")}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (props.disabled) return;
                        handleClear();
                      }}
                    />
                    <Separator
                      orientation="vertical"
                      className="flex min-h-6 h-full"
                    />
                    <ChevronDown className="h-4 ml-2 cursor-pointer text-muted-foreground opacity-50" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 items-center justify-between w-full mx-auto">
                  <span className={`text-xs sm:text-sm text-muted-foreground font-normal ${icon ? "ml-6.5" : "ml-2"}`}>
                    {showValue ? placeholder : "0"}
                  </span>
                  <div className="flex items-center justify-between">
                    {clearable && !hideRefresh &&
                      <RotateCw
                        className={cn("h-4 mx-2 cursor-pointer transition-all text-muted-foreground opacity-50", props.disabled ? "hover:text-muted-foreground hover:opacity-50" : "hover:opacity-100")}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (props.disabled) return;
                          const defaultValues = options.filter(opt => opt.default).map(opt => opt.value).filter((v): v is string => v !== undefined);
                          setSelectedValues(defaultValues);
                          onValueChange(defaultValues);
                        }}
                      />
                    }
                    <Separator
                      orientation="vertical"
                      className="flex min-h-6 h-full"
                    />
                    <ChevronDown className="h-4 cursor-pointer text-muted-foreground ml-2 opacity-50" />
                  </div>
                </div>
              )}
            </>}
          </Button>
        </PopoverTrigger>
        <Portal>
          <PopoverContent
            onScroll={handleScroll}
            className="min-w-[var(--radix-popover-trigger-width)] w-auto p-0"
            align="start"
            onEscapeKeyDown={() => setIsPopoverOpen(false)}
          >
            <Command>
              <SimpleBar className='min-w-[200px] max-w-full max-h-[var(--radix-popover-content-available-height)] w-full'>
                {searchable &&
                  (onSearchChange ?
                    <div className="px-2 pt-1 mx-1">
                      <Input
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        autoFocus
                        autoComplete="off"
                        className="border-0 border-b focus:ring-0 mb-1 focus:outline-0 rounded-none focus-visible:ring-0 focus-visible:outline-0 sm:text-xs px-0"
                        type="text"
                        placeholder="Search..."
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                    :
                    <CommandInput
                      icon={icon}
                      parentClassName="px-2 pt-1 mx-1"
                      className="sm:text-xs"
                      placeholder="Search..."
                      value={search}
                      onChangeCapture={e => setSearch(e.currentTarget.value)}
                      onKeyDown={handleInputKeyDown}
                    />)
                }
                <CommandList className="max-h-none">
                  {label && <div
                    data-slot="multi-select-label"
                    className="text-muted-foreground px-2 py-2 text-xs mx-1"
                  >
                    {label}
                  </div>}
                  <CommandEmpty className="text-muted-foreground px-2 first:pt-1.5 pb-2.5 pt-0 text-left font-normal text-xs sm:text-sm mx-1">Tidak ada pilihan yang tersedia.</CommandEmpty>
                  <CommandGroup>
                    {options.map((option, key) => {
                      if (!option.value) {
                        if (search !== "" || searchValue !== "") return null;
                        return (
                          <div
                            data-slot="multi-select-label"
                            key={key}
                            className="text-muted-foreground px-2 py-2 text-xs"
                          >
                            {option.label}
                          </div>
                        );
                      }
                      const isSelected = selectedValues.includes(option.value);
                      return (
                        <CommandItem
                          key={key}
                          onSelect={() => {
                            if (option.value !== undefined) toggleOption(option.value);
                            if (autoClose) handleTogglePopover();
                          }}
                          className="cursor-pointer"
                        >
                          <div
                            className={cn(
                              "mr-1 flex h-4 w-4 items-center justify-center rounded border border-primary",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "opacity-50 [&_svg]:invisible"
                            )}
                          >
                            <CheckIcon className="h-4 w-4 text-accent" />
                          </div>
                          <span>{option.label}</span>
                          {option?.tooltip ? (
                            <Badge variant="outline">{option.tooltip}</Badge>
                          ) : null}
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </SimpleBar>
            </Command>
          </PopoverContent>
        </Portal>
        {animation > 0 && selectedValues.length > 0 && (
          <WandSparkles
            className={cn(
              "cursor-pointer my-2 text-foreground bg-background w-3 h-3",
              isAnimating ? "" : "text-muted-foreground"
            )}
            onClick={() => setIsAnimating(!isAnimating)}
          />
        )}
      </Popover>
    );
  }
);

MultiSelect.displayName = "MultiSelect";
