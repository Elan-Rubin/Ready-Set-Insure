"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { Users } from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [customers, setCustomers] = useState([]);
  const [barChartData, setBarChartData] = useState([]);

  // Fetch clients from the backend
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch("http://localhost:5000/GetAllClients");
        const data = await response.json();
        if (response.ok) {
          setCustomers(data.users);
          updateBarChartData(data.users);
        } else {
          console.error("Failed to fetch customers:", data.error);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    }

    fetchCustomers();
  }, []);

  // Update Bar Chart Data
  function updateBarChartData(customersData) {
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const newBarChartData = daysOfWeek.map((day) => ({
      name: day,
      total: customersData.filter((customer) => {
        const customerDate = new Date(customer.date);
        return daysOfWeek[customerDate.getDay()] === day;
      }).length,
    }));
    setBarChartData(newBarChartData);
  }

  // Group customers by status
  const incompleteCustomers = customers.filter((c) => c.status === "incomplete");
  const pendingCustomers = customers.filter((c) => c.status === "pending");
  const completeCustomers = customers.filter((c) => c.status === "completed");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">
        Ready, Set, Insure! Dashboard
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Customer Assistance */}
        <Card className="col-span-1 h-full">
          <CardHeader>
            <CardTitle>Customer Assistance</CardTitle>
            <CardDescription className="text-red-500">
              {incompleteCustomers.length} customer(s) need assistance
            </CardDescription>
            <CardDescription className="text-yellow-500">
              {pendingCustomers.length} customer(s) are receiving assistance
            </CardDescription>
            <CardDescription className="text-green-500">
              {completeCustomers.length} customer(s) completed assistance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {customers.map((customer, index) => (
                <div key={index} className="flex items-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src="/placeholder.svg?height=32&width=32"
                      alt="Avatar"
                    />
                    <AvatarFallback>
                      {customer.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {customer.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {customer.date ? format(new Date(customer.date), "PPP") : "N/A"}
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>

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
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Calendar */}
        <div className="col-span-1 flex flex-col gap-6">
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
            <CardContent>
              <Button variant="outline" className="w-full">
                {date ? format(date, "PPP") : "Pick a date"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
