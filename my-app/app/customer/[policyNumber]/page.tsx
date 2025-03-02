"use client"

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { FileText, Send, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export default function CustomerPage({ params }: { params: { policyNumber: string } }) {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [summary, setSummary] = useState("");

  // Fetch customer data based on policy number
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/confirmUser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ policy_number: params.policyNumber }),
        });

        const data = await response.json();
        
        if (response.ok && data.has_active_policy) {
          setUserData(data.user_data);
          setSummary(data.user_data.summary || "");
          
          // Set default call history if none exists
          if (data.user_data.chatlog) {
            try {
              const chatlogData = JSON.parse(data.user_data.chatlog);
              setCallHistory(chatlogData);
            } catch (e) {
              console.error("Error parsing chatlog:", e);
              setCallHistory([
                { id: 1, message: "Hello, how can I help you today?", sender: "assistant" },
                { id: 2, message: "I have a question about my policy.", sender: "client" },
                { id: 3, message: "I'd be happy to assist with that. What would you like to know?", sender: "assistant" },
              ]);
            }
          } else {
            setCallHistory([
              { id: 1, message: "Hello, how can I help you today?", sender: "assistant" },
              { id: 2, message: "I have a question about my policy.", sender: "client" },
              { id: 3, message: "I'd be happy to assist with that. What would you like to know?", sender: "assistant" },
            ]);
          }
        } else {
          setError("Customer not found");
        }
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError("Failed to load customer data");
      } finally {
        setLoading(false);
      }
    };

    if (params.policyNumber) {
      fetchCustomerData();
    }
  }, [params.policyNumber]);

  // Function to determine sender based on message ID
  const getSender = (messageId: number) => {
    return messageId % 2 === 1 ? "Ready Set Assistant" : userData?.name || "Customer";
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Add message to local state first for immediate feedback
      const newId = callHistory.length + 1;
      const newMessageObj = {
        id: newId,
        message: newMessage,
        sender: "assistant",
        timestamp: new Date().toISOString()
      };

      setCallHistory([...callHistory, newMessageObj]);
      setNewMessage("");

      // Then send to backend
      await fetch("http://localhost:5000/UpdateClientChatlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policy_number: params.policyNumber,
          message: newMessage,
          sender: "assistant"
        }),
      });
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Handle updating summary
  const handleUpdateSummary = async () => {
    try {
      await fetch("http://localhost:5000/UpdateClientSummary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policy_number: params.policyNumber,
          summary: summary
        }),
      });
    } catch (err) {
      console.error("Error updating summary:", err);
    }
  };

  // Handle back button
  const handleBack = () => {
    router.push("/");
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading customer data...</div>;
  }

  if (error || !userData) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <div className="text-red-500 mb-4">{error || "Customer not found"}</div>
        <Button onClick={handleBack}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-secondary p-4 flex items-center">
        <Button variant="outline" size="icon" className="mr-2" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Customer Details</h1>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column - Insured Info */}
        <div className="w-1/3 border-r overflow-auto p-4">
          <div className="flex items-center space-x-4 mb-6">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src="/placeholder.svg?height=50&width=50"
                alt={userData.name}
              />
              <AvatarFallback>{userData.name ? userData.name[0] : "U"}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-semibold">{userData.name}</h2>
              <p className="text-sm text-muted-foreground">Insured</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Case Information</h3>
              <p className="text-sm text-muted-foreground">
                Case opened: {userData.date ? format(new Date(userData.date), "PPP") : "N/A"}
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
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Insured Information</h3>
              <p className="text-sm text-muted-foreground">
                Email: {userData.email || "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                Policy Number: {userData.policy_number || "N/A"}
              </p>
              {userData.dob && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Age:{" "}
                    {new Date().getFullYear() - new Date(userData.dob).getFullYear()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Date of birth: {format(new Date(userData.dob), "PPP")}
                  </p>
                </>
              )}
              <p className="text-sm text-muted-foreground">Sex: {userData.sex || "N/A"}</p>
              <p className="text-sm text-muted-foreground">Phone: {userData.phone || "N/A"}</p>
            </div>
          </div>
        </div>

        {/* Center Column - Summary */}
        <div className="w-1/3 border-r flex flex-col p-4">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <div className="flex-1 overflow-auto mb-4">
            {userData.summary ? (
              <p className="text-muted-foreground">{userData.summary}</p>
            ) : (
              <p className="text-muted-foreground">No summary available yet.</p>
            )}
          </div>
          
          {/* Add summary form */}
          <div className="mt-auto pt-4 border-t">
            <Textarea 
              placeholder="Add or update summary..." 
              className="min-h-24 mb-2"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
            <Button className="w-full" onClick={handleUpdateSummary}>Update Summary</Button>
          </div>
        </div>

        {/* Right Column - Call History */}
        <div className="w-1/3 flex flex-col">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Customer Service Call History</h2>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="space-y-4">
              {callHistory.map((message) => {
                const sender = message.sender === "client" ? userData?.name || "Customer" : "Ready Set Assistant";
                const isCustomer = message.sender === "client";

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
                          <AvatarFallback>{userData.name ? userData.name[0] : "C"}</AvatarFallback>
                        ) : (
                          <AvatarImage src="/placeholder.svg?height=32&width=32" alt={sender} />
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
                );
              })}
            </div>
          </div>

          {/* Message input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <Textarea 
                placeholder="Type a message..." 
                className="flex-1"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}