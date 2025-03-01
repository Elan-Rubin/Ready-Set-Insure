"use client"
import { Send, FileText } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar"

// Sample user data
const userData = {
  name: "John Doe",
  email: "john.doe@example.com",
  avatar: "/placeholder.svg?height=50&width=50",
  role: "Insured",
  age: 35,
  sex: "Male",
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
    avatar: "/placeholder.svg?height=40&width=40",
    message: "Hello! How can I assist you with your insurance today?",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    sender: "You",
    avatar: "/placeholder.svg?height=40&width=40",
    message: "I have a question about my policy coverage.",
    timestamp: "10:32 AM",
  },
  {
    id: 3,
    sender: "Customer Service Bot",
    avatar: "/placeholder.svg?height=40&width=40",
    message: "Sure, I'd be happy to help. What specific details do you need?",
    timestamp: "10:33 AM",
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
              <AvatarImage src={userData.avatar} alt={userData.name} />
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
            <p className="text-sm text-muted-foreground">Email: {userData.email}</p>
            <p className="text-sm text-muted-foreground">Age: {userData.age}</p>
            <p className="text-sm text-muted-foreground">Sex: {userData.sex}</p>
          </div>
        </SidebarContent>
        <SidebarContent>
          <div className="flex-1 overflow-auto border-t p-4">
            <h3 className="mb-2 flex items-center text-lg font-semibold">
              <FileText className="mr-2 h-5 w-5" />
              Notes
            </h3>
            <div className="space-y-2">
              {notes.map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-2 text-sm">{note.content}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Center Column - Empty for now */}
      <div className="flex-1 border-r p-4">
        <h2 className="text-2xl font-bold mb-4">Main Content Area</h2>
        <p className="text-muted-foreground">This area is currently empty and can be used for future content.</p>
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
              <div key={message.id} className={`flex ${message.sender === "You" ? "justify-end" : "justify-start"}`}>
                <div className={`flex max-w-[80%] ${message.sender === "You" ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.avatar} alt={message.sender} />
                    <AvatarFallback>{message.sender[0]}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`mx-2 rounded-lg p-4 ${
                      message.sender === "You" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <div className="mb-1 text-xs font-medium">
                      {message.sender} • {message.timestamp}
                    </div>
                    <div>{message.message}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t p-4">
          <div className="flex items-end gap-2">
            <Textarea placeholder="Type your message..." className="min-h-[80px]" />
            <Button size="icon" className="h-10 w-10 shrink-0">
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
