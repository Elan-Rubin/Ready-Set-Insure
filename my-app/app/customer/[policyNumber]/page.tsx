"use client"

import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { FileText, Send, ArrowLeft, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Toast } from "@/components/ui/toast";

export default function CustomerPage({ params }: { params: { policyNumber: string } }) {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [summary, setSummary] = useState("");
  const [analysis, setCall] = useState("");
  const [feedback, setFeedback] = useState("");
  const [chat, setChat] = useState("");
  const [showToast, setShowToast] = useState(false);
  
  // Animation states
  const [displayedSummary, setDisplayedSummary] = useState("");
  const [leftColumnVisible, setLeftColumnVisible] = useState(false);
  const [leftColumnItems, setLeftColumnItems] = useState<boolean[]>([false, false, false]);

  // Parse chatlog string into structured messages
  const parseRawChatlog = (chatlogString: string) => {
    if (!chatlogString || typeof chatlogString !== 'string') {
      return [];
    }

    // Split by new lines
    const lines = chatlogString.split('\n').filter(line => line.trim() !== '');
    
    const messages = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Check if line starts with AI: or User:
      if (line.startsWith('AI:')) {
        messages.push({
          id: i + 1,
          message: line.substring(3).trim(),
          sender: "assistant"
        });
      } else if (line.startsWith('User:')) {
        messages.push({
          id: i + 1,
          message: line.substring(5).trim(),
          sender: "client"
        });
      }
    }
    
    return messages;
  };

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
          
          // We'll now rely on fetchChat to get the chatlog data
          // This fetch is no longer responsible for chat history
          
          // Start animations after data loads
          startAnimations();
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
  
  useEffect(() => {
    async function fetchCall() {
      try {
        const response = await fetch(`http://localhost:5000/getcall/${params.policyNumber}`);
        const data = await response.json();
        if (response.ok) {
          setCall(data);
          console.log("Call analysis:", data);
        } else {
          console.error("Failed to fetch call analysis:", data.error);
        }
      } catch (error) {
        console.error("Error fetching call analysis:", error);
      }
    }

    fetchCall();
  }, [params.policyNumber]);

  // Updated fetchChat to properly set the callHistory state
  useEffect(() => {
    async function fetchChat() {
      try {
        const response = await fetch(`http://localhost:5000/getchatlogs/${params.policyNumber}`);
        const data = await response.json();
        if (response.ok) {
          setChat(data);
          console.log("Chat data received:", data);
          
          // Parse the chatlog and update the callHistory state
          if (data && typeof data === 'string') {
            const parsedMessages = parseRawChatlog(data);
            setCallHistory(parsedMessages);
          } else if (Array.isArray(data)) {
            // If the API returns already structured data
            setCallHistory(data);
          }
        } else {
          console.error("Failed to fetch chat logs:", data.error);
        }
      } catch (error) {
        console.error("Error fetching chat logs:", error);
      }
    }

    fetchChat();
  }, [params.policyNumber]);

  // Animation functions
  const startAnimations = () => {
    // Start left column fade-in
    animateLeftColumn();
    
    // Start typing animation for summary
    if (analysis && typeof analysis === 'string') {
      animateTyping(analysis);
    }
    
    // Start message appearance animation - Make sure this runs regardless of message content
    animateMessages();
  };

  const animateLeftColumn = () => {
    setLeftColumnVisible(true);
    
    // Fade in items one by one
    setTimeout(() => setLeftColumnItems([true, false, false]), 500);
    setTimeout(() => setLeftColumnItems([true, true, false]), 1200);
    setTimeout(() => setLeftColumnItems([true, true, true]), 1900);
  };

  const animateTyping = (text: string) => {
    let i = 0;
    const typingSpeed = 30; // ms per character
    
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayedSummary(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, typingSpeed);
    
    return () => clearInterval(typingInterval);
  };

  const animateMessages = () => {
    // No animation for messages in the right column
    // Keeping the function for the animation sequence but not doing anything
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

      const updatedHistory = [...callHistory, newMessageObj];
      setCallHistory(updatedHistory);
      
      setNewMessage("");

      // Format for backend update
      const existingChatlog = chat.toString();
      const updatedChatlog = `${existingChatlog}${existingChatlog ? '\n' : ''}AI: ${newMessage}`;
      
      // Update backend (commented out for now)
      /*
      await fetch("http://localhost:5000/UpdateClientChatlog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policy_number: params.policyNumber,
          chatlog: updatedChatlog
        }),
      });
      */
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

  // Handle sending feedback notification
  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;

    try {
      // Implement the notification sending logic here
      await fetch("http://localhost:5000/SendCustomerFeedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policy_number: params.policyNumber,
          feedback: feedback
        }),
      });
      
      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      // Clear the feedback input
      setFeedback("");
    } catch (err) {
      console.error("Error sending feedback:", err);
    }
  };

  // Handle back button
  const handleBack = () => {
    router.push("/dashboard-view");
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
        <div className={`w-1/3 border-r overflow-auto p-4 transition-opacity duration-500 ${leftColumnVisible ? 'opacity-100' : 'opacity-0'}`}>
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
            <div className={`transition-all duration-500 ${leftColumnItems[0] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h3 className="text-lg font-semibold mb-2">Case Information</h3>
              <p className="text-sm text-muted-foreground">
                Case opened: {userData.date ? format(new Date(userData.date), "PPP") : "N/A"}
              </p>
              <p className="text-sm text-muted-foreground">
                Policy Number: {userData.policy_number || "N/A"}
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
                    {userData.status?.toUpperCase()}
                </span>
              </p>
            </div>
            
            <div className={`transition-all duration-500 ${leftColumnItems[1] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h3 className="text-lg font-semibold mb-2">Insured Information</h3>
              <p className="text-sm text-muted-foreground">
                Email: {userData.email || "N/A"}
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
            {analysis ? (
              <p className="text-muted-foreground cursor-typing">{analysis}</p>
            ) : (
              <p className="text-muted-foreground">No summary available yet.</p>
            )}
          </div>
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-2">Employee Feedback</h3>
            <Textarea
              placeholder="Enter feedback for the customer..."
              className="min-h-[80px] mb-2"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <Button 
              className="w-full flex items-center justify-center" 
              onClick={handleSendFeedback}
            >
              <Bell className="mr-2 h-4 w-4" />
              Notify Customer
            </Button>
          </div>
          {showToast && (
            <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
              Feedback sent successfully!
            </div>
          )}
        </div>

        {/* Right Column - Call History */}
        <div className="w-1/3 flex flex-col">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Customer Service Call History</h2>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {callHistory.length > 0 ? (
              <div className="space-y-4">
                {callHistory.map((message) => {
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
                            <AvatarImage src="/rsi_logo.png" alt="Sarah (AI)" />
                          )}
                        </Avatar>
                        <div
                          className={`mx-2 rounded-lg p-4 ${
                            isCustomer
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <div className="mb-1 text-xs font-medium">
                            {isCustomer ? (userData?.name || "Customer") : "Sarah (AI)"}
                          </div>
                          <div>{message.message}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No conversation history available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}