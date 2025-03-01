"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { type TooltipProps, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

import { cn } from "@/components/lib/utils"

type ChartConfig = {
  [key: string]: {
    label: string
    color: string
    icon?: LucideIcon
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: ChartConfig
}

function ChartContainer({ config, children, className, ...props }: ChartContainerProps) {
  const chartConfig = React.useMemo(() => {
    return config
      ? Object.entries(config).reduce((acc, [key, value]) => {
          return {
            ...acc,
            [key]: value,
            [`color-${key}`]: value.color,
          }
        }, {})
      : {}
  }, [config])

  return (
    <div
      className={cn("h-80", className)}
      style={
        {
          "--color-chart-0": "hsl(var(--chart-1))",
          "--color-chart-1": "hsl(var(--chart-2))",
          "--color-chart-2": "hsl(var(--chart-3))",
          "--color-chart-3": "hsl(var(--chart-4))",
          "--color-chart-4": "hsl(var(--chart-5))",
          ...Object.entries(chartConfig).reduce((acc, [key, value]) => {
            return {
              ...acc,
              [`--color-${key}`]: value.color,
            }
          }, {}),
        } as React.CSSProperties
      }
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}

interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  formatter?: (value: number, name: string, item: any) => [string, string]
  labelFormatter?: (label: string) => string
  hideLabel?: boolean
}

function ChartTooltipContent({
  formatter,
  labelFormatter,
  hideLabel = false,
  className,
  ...props
}: ChartTooltipContentProps) {
  return (
    <RechartsTooltip
      content={({ active, payload, label }) => {
        if (!active || !payload?.length) {
          return null
        }

        const formattedLabel = labelFormatter ? labelFormatter(label) : label

        return (
          <div className={cn("rounded-md border bg-background px-3 py-2 shadow-md", className)} {...props}>
            {!hideLabel && <div className="mb-2 text-sm font-medium">{formattedLabel}</div>}
            <div className="flex flex-col gap-0.5">
              {payload.map((item: any, i: number) => {
                const formattedValue = formatter ? formatter(item.value, item.name, item) : [item.value, item.name]

                const Icon = item.payload?.icon

                return (
                  <div key={i} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <div
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor: item.color,
                        }}
                      />
                      <span className="text-muted-foreground">{formattedValue[1]}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {Icon && <Icon className="size-3" />}
                      <span className="font-medium">{formattedValue[0]}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      }}
    />
  )
}

interface ChartTooltipProps extends TooltipProps {
  content?: React.ReactNode
}

function ChartTooltip({ content, ...props }: ChartTooltipProps) {
  return <RechartsTooltip content={content} {...props} />
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }

