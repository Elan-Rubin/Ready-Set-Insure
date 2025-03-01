"use client"

import React from "react"

import { CalendarIcon, DollarSign, Users } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bar, BarChart, Line, LineChart as LineChartComponent, ResponsiveContainer, XAxis, YAxis } from "recharts"

export default function Dashboard() {
  const [date, setDate] = React.useState<Date | undefined>(new Date())

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Recent Sales */}
        <Card className="col-span-1 h-full">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>You made 265 sales this month.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentSales.map((sale, index) => (
                <div key={index} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={sale.avatar} alt="Avatar" />
                    <AvatarFallback>{sale.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.name}</p>
                    <p className="text-sm text-muted-foreground">{sale.email}</p>
                  </div>
                  <div className="ml-auto font-medium">+${sale.amount}</div>
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
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$45,231.89</div>
              <p className="text-xs text-muted-foreground">+20.1% from last month</p>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Weekly Sales</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barChartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Number Block 2 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+2,350</div>
              <p className="text-xs text-muted-foreground">+180.1% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Line Chart and Calendar */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Line Chart */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle>Monthly Revenue</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={200}>
                <LineChartComponent data={lineChartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}k`}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChartComponent>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Select a date to view scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
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

// Sample data for the components
const recentSales = [
  {
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    amount: 1999,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    amount: 1139,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    amount: 2499,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "William Kim",
    email: "will.kim@email.com",
    amount: 499,
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    amount: 899,
    avatar: "/placeholder.svg?height=32&width=32",
  },
]

const barChartData = [
  {
    name: "Mon",
    total: 420,
  },
  {
    name: "Tue",
    total: 380,
  },
  {
    name: "Wed",
    total: 520,
  },
  {
    name: "Thu",
    total: 490,
  },
  {
    name: "Fri",
    total: 610,
  },
  {
    name: "Sat",
    total: 390,
  },
  {
    name: "Sun",
    total: 280,
  },
]

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

