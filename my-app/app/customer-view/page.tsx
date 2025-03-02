"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { FileText, Send } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sidebar, SidebarContent, SidebarHeader } from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea"

// Sample call history - later this could also be fetched from an API
const callHistory = [
  {
    id: 1,
    message: "Message 1",
  },
  {
    id: 2,
    message: "Message 2",
  },
  {
    id: 3,
    message: "Message 3",
  },
]

export default function CustomerPage() {
  // Hardcoded policy number
  const policyNumber = "12345676"
  
  const [userData, setUserData] = useState({
    name: "Loading...",
    email: "",
    role: "Insured",
    dob: new Date().toISOString(),
    sex: "",
    date: new Date().toISOString(),
    status: "pending",
    phone: "",
  })
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchCustomerData() {
      setLoading(true)
      try {
        // Using POST request instead of GET
        const response = await fetch('/api/lookup-client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ policyNumber })
        })
        
        const data = await response.json()
        
        if (response.ok) {
          // Transform the MongoDB document to match our expected userData format
          const clientData = data.client
          setUserData({
            name: clientData.name || "Unknown",
            email: clientData.email || "",
            role: "Insured", // Default role
            dob: clientData.dob || new Date().toISOString(),
            sex: clientData.sex || "",
            date: clientData.date || new Date().toISOString(),
            status: clientData.status || "pending",
            phone: clientData.phone || "",
          })
        } else {
          console.error("Failed to fetch client:", data.error)
          setError("Failed to load client data")
        }
      } catch (error) {
        console.error("Error fetching client:", error)
        setError("An error occurred while loading client data")
      } finally {
        setLoading(false)
      }
    }

    fetchCustomerData()
  }, [])

  // Function to determine sender based on message ID
  const getSender = (messageId) => {
    return messageId % 2 === 1 ? "Ready Set Assistant" : userData.name
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading client data...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen text-red-500">{error}</div>
  }

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    try {
      return new Date().getFullYear() - new Date(dob).getFullYear()
    } catch (e) {
      return "Unknown"
    }
  }

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
              <AvatarFallback>{userData.name ? userData.name[0] : "?"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{userData.name}</h2>
              <p className="text-sm text-muted-foreground">{userData.role}</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="flex flex-col">
          <div className="flex-1 overflow-auto p-4">
          <h3 className="mt-4 mb-2 text-lg font-semibold ">
              Case Information
            </h3>
            <p className="text-sm text-muted-foreground">
              Case opened: {format(new Date(userData.date), "PPP")}
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
            <h3 className="mb-2 text-lg font-semibold">Insured Information</h3>
            <p className="text-sm text-muted-foreground">
              Email: {userData.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Age: {calculateAge(userData.dob)}
            </p>
            <p className="text-sm text-muted-foreground">
              Date of birth: {format(new Date(userData.dob), "PPP")}
            </p>
            <p className="text-sm text-muted-foreground">Sex: {userData.sex}</p>
            <p className="text-sm text-muted-foreground">Phone: {userData.phone}</p>
            <p className="text-sm text-muted-foreground">
              Policy Number: {policyNumber}
            </p>
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Center Column - Summary */}
      <div className="flex-1 border-r p-4">
        <h2 className="text-2xl font-bold mb-4">Summary</h2>
        <p className="text-muted-foreground">
          Summary of the call will go here.
        </p>
        
        <div className="mt-4 p-2 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-500">Policy Number: {policyNumber}</p>
        </div>
      </div>

      {/* Right Column - Call History */}
      <div className="flex-1 flex flex-col border-l">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Customer Service Call History</h2>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {callHistory.map((message) => {
              const sender = getSender(message.id)
              const isCustomer = message.id % 2 === 0

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isCustomer ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`flex max-w-[80%] ${
                      isCustomer ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    <Avatar className="h-8 w-8">
                      {isCustomer ? (
                      <AvatarFallback>{sender[0]}</AvatarFallback>
                      ) : (
                      <AvatarImage src="./rsi_logo.png" alt={sender} />
                      )}
                    </Avatar>
                    <div
                      className={`mx-2 rounded-lg p-4 ${
                        isCustomer
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <div className="mb-1 text-xs font-medium">{sender}</div>
                      <div>{message.message}</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}