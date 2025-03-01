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
      <h1 className="text-3xl font-bold tracking-tight">PLACEHOLDER NAME Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Recent Sales */}
        <Card className="col-span-1 h-full">
          <CardHeader>
            <CardTitle>Customer Assistance</CardTitle>
            <CardDescription className="text-[#B46879]">{customers.filter(sale => sale.status === "incomplete").length} customer(s) need assistance</CardDescription>
            <CardDescription className="text-[#B29F5C]">{customers.filter(sale => sale.status === "pending").length} customer(s) is recieving assistance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {customers
                .sort((a, b) => {
                  const statusOrder = { incomplete: 1, pending: 2, complete: 3 }
                  return statusOrder[a.status] - statusOrder[b.status]
                //   this isnt actually an eror
                })
                .map((sale, index) => (
                  <div key={index} className="flex items-center">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
                      <AvatarFallback>{sale.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{sale.name}</p>
                      <p className="text-sm text-muted-foreground">{sale.email}</p>
                    </div>
                    <div
                      className={`ml-auto font-medium ${
                        sale.status === "incomplete"
                          ? "text-red-500"
                          : sale.status === "pending"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }`}
                    >
                      {sale.status}
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
              <p className="text-xs text-[#B46879]">
                {`${(
                  (customers.filter((sale) => sale.status === "incomplete" || sale.status === "pending").length /
                    customers.length) *
                  100
                ).toFixed(0)}% need help`}
              </p>
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

const customers = [
  {
    //this info needed for dashboard
    name: "Olivia Martin",
    email: "olivia.martin@email.com",
    status: "complete",
    date:"",
    //this info needed for individual
    chatlog:"",
    summary:"",
    age:"",
    sex:"",
  },
  {
    name: "Jackson Lee",
    email: "jackson.lee@email.com",
    status: "incomplete"
  },
  {
    name: "Isabella Nguyen",
    email: "isabella.nguyen@email.com",
    status: "incomplete"
  },
  {
    name: "William Kim",
    email: "will.kim@email.com",
    status: "pending"
  },
  {
    name: "Sofia Davis",
    email: "sofia.davis@email.com",
    status: "complete"
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

