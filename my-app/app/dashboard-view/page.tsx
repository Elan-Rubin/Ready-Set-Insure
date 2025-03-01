"use client"

import React from "react"
import { format } from "date-fns"
import { CalendarIcon, DollarSign, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  Line,
  LineChart as LineChartComponent,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function Dashboard() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        PLACEHOLDER NAME Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Recent Sales */}
        <Card className="col-span-1 h-full">
          <CardHeader>
            <CardTitle>Customer Assistance</CardTitle>
            <CardDescription className="text-red-500">
              {customers.filter((sale) => sale.status === "incomplete").length}{" "}
              customer(s) need assistance
            </CardDescription>
            <CardDescription className="text-yellow-500">
              {customers.filter((sale) => sale.status === "pending").length}{" "}
              customer(s) is receiving assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {customers
                .sort((a, b) => {
                  const statusOrder = { incomplete: 1, pending: 2, complete: 3 }
                  return statusOrder[a.status] - statusOrder[b.status]
                  //   this isnt actually an eror
                })
                .map((customer, index) => (
                  <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src="/placeholder.svg?height=32&width=32"
                        alt="Avatar"
                      />
                      <AvatarFallback>
                        {customer.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {customer.name}
                      </p>
                      {/* <p className="text-sm text-muted-foreground">
                        {customer.email}
                      </p> */}
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(customer.date), "do 'of' MMMM yyyy")}
                      </p>
                    </div>
                    <div
                      className={`ml-auto font-medium ${
                        customer.status === "incomplete"
                          ? "text-red-500"
                          : customer.status === "pending"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {customer.status}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Middle Column - Stats and Bar Chart */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Number Block 1 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Assistance Requested Based on Day</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barChartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Bar
                    dataKey="total"
                    radius={[4, 4, 0, 0]}
                    shape={(props) => {
                      const { x, y, width, height, value } = props

                      // Find min and max values
                      const values = barChartData.map((item) => item.total)
                      const minValue = Math.min(...values)
                      const maxValue = Math.max(...values)

                      // Get the color based on value
                      const stroke = getGradientColor(value, minValue, maxValue)

                      return (
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill="transparent"
                          stroke={stroke}
                          strokeWidth={3}
                          radius={[4, 4, 0, 0]}
                        />
                      )
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Line Chart and Calendar */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Line Chart */}
          {/* <Card className="flex-1">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={200}>
                <LineChartComponent data={lineChartData}>
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}k`}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChartComponent>
              </ResponsiveContainer>
            </CardContent>
          </Card> */}

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Assistance Requested - Calendar</CardTitle>
              <CardDescription>
                Select a date to view scheduled events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border"
              />
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

const customers = [
  {
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    status: "complete",
    date: "2025-03-03",

    chatlog: "",
    summary: "",
    age: "",
    sex: "",
  },
  {
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    status: "incomplete",
    date: "2025-03-03",
  },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    status: "incomplete",
    date: "2025-03-03",
  },
  {
    name: "William Kim",
    email: "will.kim@email.com",
    status: "pending",
    date: "2025-03-02",
  },
  {
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    status: "complete",
    date: "2025-03-06",
  },
  {
    name: "Liam Brown",
    email: "liam.brown@email.com",
    status: "pending",
    date: "2025-03-04",
  },
  {
    name: "Emma Wilson",
    email: "emma.wilson@email.com",
    status: "complete",
    date: "2025-03-08",
  },
  {
    name: "Noah Johnson",
    email: "noah.johnson@email.com",
    status: "incomplete",
    date: "2025-03-01",
  },
]

var barChartData = [
  {
    name: "Mon",
    total: 0,
  },
  {
    name: "Tue",
    total: 0,
  },
  {
    name: "Wed",
    total: 0,
  },
  {
    name: "Thu",
    total: 0,
  },
  {
    name: "Fri",
    total: 0,
  },
  {
    name: "Sat",
    total: 0,
  },
  {
    name: "Sun",
    total: 0,
  },
]

function loadBarChartData() {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const newBarChartData = daysOfWeek.map((day) => ({
    name: day,
    total: customers.filter((customer) => {
      const customerDate = new Date(customer.date)
      return daysOfWeek[customerDate.getDay()] === day
    }).length,
  }))
  barChartData = newBarChartData
}

loadBarChartData()

const lineChartData = [
  {
    name: "Jan",
    revenue: 10,
  },
  {
    name: "Feb",
    revenue: 15,
  },
  {
    name: "Mar",
    revenue: 12,
  },
  {
    name: "Apr",
    revenue: 18,
  },
  {
    name: "May",
    revenue: 22,
  },
  {
    name: "Jun",
    revenue: 20,
  },
  {
    name: "Jul",
    revenue: 25,
  },
  {
    name: "Aug",
    revenue: 28,
  },
  {
    name: "Sep",
    revenue: 30,
  },
  {
    name: "Oct",
    revenue: 32,
  },
  {
    name: "Nov",
    revenue: 35,
  },
  {
    name: "Dec",
    revenue: 40,
  },
]

function getGradientColor(value, minValue, maxValue) {
  // If min and max are the same, return yellow (middle color)
  if (minValue === maxValue) {
    return "rgb(253, 224, 71)" // Yellow
  }

  // Calculate normalized position in the range (0 to 1)
  const normalizedValue = (value - minValue) / (maxValue - minValue)

  // Interpolate colors: Green (lowest) -> Yellow (middle) -> Red (highest)
  // RGB values: Green(34,197,94), Yellow(253,224,71), Red(239,68,68)
  let r, g, b

  if (normalizedValue <= 0.5) {
    // Green to Yellow (normalize 0-0.5 range to 0-1)
    const t = normalizedValue * 2
    r = Math.round(34 + (253 - 34) * t)
    g = Math.round(197 + (224 - 197) * t)
    b = Math.round(94 + (71 - 94) * t)
  } else {
    // Yellow to Red (normalize 0.5-1 range to 0-1)
    const t = (normalizedValue - 0.5) * 2
    r = Math.round(253 + (239 - 253) * t)
    g = Math.round(224 + (68 - 224) * t)
    b = Math.round(71 + (68 - 71) * t)
  }

  // Return RGB color string
  return `rgb(${r}, ${g}, ${b})`
}
