"use client"

import { FileText, Send } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"

// Sample user data
const userData = {
  name: "John Doe",
  email: "john.doe@example.com",
  role: "Insured",
  age: 35,
  sex: "Male",
  date: "2025-03-01",
  status: "complete",
}

const notes = [
  { id: 1, content: "Meeting with team at 2 PM" },
  { id: 2, content: "Review project proposal" },
  { id: 3, content: "Prepare presentation for client" },
]

// Sample call history
const callHistory = [
  {
    id: 1,
    sender: "Customer Service Bot",
    message: "Message 1",
  },
  {
    id: 2,
    sender: "You",
    message: "Message 2",
  },
  {
    id: 3,
    sender: "Customer Service Bot",
    message: "Message 3",
  },
]

export default function DashboardPage() {
  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Left Column - Insured Info */}
      <Sidebar collapsible="none" className="flex-1 border-r">
        <SidebarHeader className="border-b p-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage
                src="/placeholder.svg?height=50&width=50"
                alt={userData.name}
              />
              <AvatarFallback>{userData.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{userData.name}</h2>
              <p className="text-sm text-muted-foreground">{userData.role}</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex flex-col">
          <div className="flex-1 overflow-auto p-4">
            <h3 className="mb-2 text-lg font-semibold">Insured Information</h3>
            <p className="text-sm text-muted-foreground">
              Email: {userData.email}
            </p>
            <p className="text-sm text-muted-foreground">Age: {userData.age}</p>
            <p className="text-sm text-muted-foreground">Sex: {userData.sex}</p>
            <h3 className="mt-4 mb-2 text-lg font-semibold">
              Case Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Case opened: {userData.date}
            </p>
            <p className="text-sm text-muted-foreground">
              Status:{" "}
              <span
          className={`font-medium ${
            userData.status === "incomplete"
              ? "text-red-500"
              : userData.status === "pending"
              ? "text-yellow-500"
              : "text-green-500"
          }`}
              >
          {userData.status}
              </span>
            </p>
          </div>
        </SidebarContent>
        {/* <SidebarContent>
          <div className="flex-1 overflow-auto border-t p-4">
            <h3 className="mb-2 flex items-center text-lg font-semibold">
              <FileText className="mr-2 h-5 w-5" />
              Notes
            </h3>
            <div className="space-y-2">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-2 text-sm">
                    {note.content}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarContent> */}
      </Sidebar>

      {/* Center Column - Empty for now */}
      <div className="flex-1 border-r p-4">
        <h2 className="text-2xl font-bold mb-4">Summary</h2>
        <p className="text-muted-foreground">
          Summary of the call will go here.
        </p>
      </div>

      {/* Right Column - Call History */}
      <div className="flex-1 flex flex-col border-l">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Customer Service Bot</h2>
          <p className="text-sm text-muted-foreground">Call History</p>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {callHistory.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === "You" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[80%] ${
                    message.sender === "You" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{message.sender[0]}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`mx-2 rounded-lg p-4 ${
                      message.sender === "You"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div className="mb-1 text-xs font-medium">
                      {message.sender}
                    </div>
                    <div>{message.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
