"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { cn } from "@repo/ui";

export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

interface LineItemsProps {
  items: LineItem[];
  currency: string;
  onChange: (items: LineItem[]) => void;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
  INR: "₹",
  CHF: "CHF",
  MXN: "MX$",
  BRL: "R$",
};

export function LineItems({ items, currency, onChange }: LineItemsProps) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  };

  const addItem = () => {
    onChange([...items, { description: "", quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    onChange(items.filter((_, i) => i !== index));
  };

  const getAmount = (item: LineItem) => item.quantity * item.unitPrice;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-3 text-right">Unit Price</div>
        <div className="col-span-2 text-right">Amount</div>
      </div>

      {/* Line Items */}
      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-12 gap-2 items-center group"
        >
          <div className="col-span-5">
            <Input
              placeholder="Service or product description"
              value={item.description}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="col-span-2">
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="1"
              value={item.quantity === 0 ? "" : item.quantity}
              onChange={(e) =>
                updateItem(index, "quantity", parseFloat(e.target.value) || 0)
              }
              className="h-9 text-sm text-center"
            />
          </div>
          <div className="col-span-3">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {symbol}
              </span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={item.unitPrice === 0 ? "" : item.unitPrice}
                onChange={(e) =>
                  updateItem(
                    index,
                    "unitPrice",
                    parseFloat(e.target.value) || 0
                  )
                }
                className={cn("h-9 text-sm text-right pr-2", symbol.length > 1 ? "pl-10" : "pl-6")}
              />
            </div>
          </div>
          <div className="col-span-2 flex items-center justify-end gap-1">
            <span className="text-sm font-medium text-right flex-1">
              {symbol}
              {getAmount(item).toFixed(2)}
            </span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}

      {/* Add Item Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addItem}
        className="w-full border-dashed text-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add line item
      </Button>
    </div>
  );
}
