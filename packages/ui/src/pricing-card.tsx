"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./card";

interface PricingCardProps {
  name: string;
  price: number;
  description: string;
  features: string[];
  isPopular?: boolean;
  isCurrent?: boolean;
  onSelect: () => void;
  ctaLabel?: string;
  className?: string;
}

export function PricingCard({
  name,
  price,
  description,
  features,
  isPopular = false,
  isCurrent = false,
  onSelect,
  ctaLabel,
  className,
}: PricingCardProps) {
  const defaultCta = isCurrent ? "Current Plan" : price === 0 ? "Get Started Free" : "Upgrade to Pro";

  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPopular && "border-primary shadow-lg scale-105",
        className
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{name}</CardTitle>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-bold">${price}</span>
          {price > 0 && (
            <span className="text-muted-foreground text-sm">/month</span>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-4">
        <ul className="space-y-3 flex-1">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        <Button
          onClick={onSelect}
          variant={isPopular ? "default" : "outline"}
          disabled={isCurrent}
          className="w-full"
        >
          {ctaLabel || defaultCta}
        </Button>
      </CardContent>
    </Card>
  );
}
