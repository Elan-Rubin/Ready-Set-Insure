"use client"

import React, { useEffect, useState, useRef } from "react";
import { format } from "date-fns";
import { 
  FileText, 
  Send, 
  ArrowLeft, 
  Bell, 
  CheckCircle, 
  XCircle, 
  Info,
  Phone
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
// Toast component is handled with our custom implementation
// Badge component inline since @/components/ui/badge is not available
const Badge = ({ 
  children, 
  variant, 
  className 
}: { 
  children: React.ReactNode; 
  variant?: string; 
  className?: string;
}) => {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
};

export default function CustomerPage({ params }: { params: { policyNumber: string } }) {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [summary, setSummary] = useState("");
  // const [analysis, setAnalysis] = useState("");
  const [feedback, setFeedback] = useState("");
  const [chat, setChat] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("info"); // info, success, error
  const [isCallingCustomer, setIsCallingCustomer] = useState(false);
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);
  const [callStatusCheckInterval, setCallStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [analysis, setCall] = useState("")
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
          sender: "assistant",
          timestamp: new Date().toISOString()
        });
      } else if (line.startsWith('User:')) {
        messages.push({
          id: i + 1,
          message: line.substring(5).trim(),
          sender: "client",
          timestamp: new Date().toISOString()
        });
      } else if (line.startsWith('---')) {
        // Call separator
        messages.push({
          id: `separator_${i}`,
          message: line,
          sender: "system",
          timestamp: new Date().toISOString()
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

    // Cleanup function to clear intervals
    return () => {
      if (callStatusCheckInterval) {
        clearInterval(callStatusCheckInterval);
      }
    };
  }, [params.policyNumber]);

  // Function to determine sender based on message ID
  const getSender = (messageId: number) => {
    return messageId % 2 === 1 ? "Ready Set Assistant" : userData?.name || "Customer";
  };
  
  useEffect(() => {
    async function fetchCall() {
      try {
        const response = await fetch(`http://localhost:5000/getcall/${params.policyNumber}`);
        const data = await response.json()
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

  // Check call status periodically
  const checkCallStatus = async (callId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/checkCallStatus?call_id=${callId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update UI based on call status
        if (data.status) {
          const statusMap: {[key: string]: string} = {
            "initiated": "Initiating call...",
            "ringing": "Calling customer...",
            "in-progress": "Customer is on the call",
            "completed": "Call completed successfully",
            "failed": "Call failed to connect",
            "canceled": "Call was canceled",
            "ended": "Call ended"
          };
          
          const statusMessage = statusMap[data.status] || data.status;
          setToastMessage(statusMessage);
          
          if (data.status === "completed" || data.status === "ended") {
            setIsCallingCustomer(false);
            setToastType("success");
            // Fetch updated call history
            fetchCallHistory();
            // Fetch updated call analysis
            fetchCall();
            
            // Clear interval
            if (callStatusCheckInterval) {
              clearInterval(callStatusCheckInterval);
              setCallStatusCheckInterval(null);
            }
            
            // Show success message for a few seconds
            setTimeout(() => setShowToast(false), 3000);
          } else if (data.status === "failed" || data.status === "canceled") {
            setIsCallingCustomer(false);
            setToastType("error");
            
            // Clear interval
            if (callStatusCheckInterval) {
              clearInterval(callStatusCheckInterval);
              setCallStatusCheckInterval(null);
            }
            
            // Show error message for a few seconds
            setTimeout(() => setShowToast(false), 5000);
          }
        }
      }
    } catch (error) {
      console.error("Error checking call status:", error);
    }
  };

  // Handle sending feedback notification and initiating outbound call
  const handleSendFeedback = async () => {
    if (!feedback.trim()) return;
    
    // If already calling, don't allow another call
    if (isCallingCustomer) {
      setToastMessage("A call is already in progress");
      setToastType("info");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }

    try {
      // Set calling state
      setIsCallingCustomer(true);
      setToastMessage("Initiating call to customer...");
      setToastType("info");
      setShowToast(true);

      // Send the feedback to the backend to initiate the outbound call
      const response = await fetch("http://localhost:5000/SendCustomerFeedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          policy_number: params.policyNumber,
          feedback: feedback
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store call ID for status checking
        setCurrentCallId(data.call_id);
        
        // Add the feedback to the call history as a system message
        const newSystemMessage = {
          id: `feedback_${Date.now()}`,
          message: `Initiated call to share feedback: "${feedback}"`,
          sender: "system",
          timestamp: new Date().toISOString()
        };
        
        setCallHistory([...callHistory, newSystemMessage]);
        
        // Clear the feedback input
        setFeedback("");
        
        // Set up interval to check call status
        const interval = setInterval(() => {
          if (data.call_id) {
            checkCallStatus(data.call_id);
          }
        }, 5000); // Check every 5 seconds
        
        setCallStatusCheckInterval(interval);
      } else {
        // Show error toast
        setToastMessage(`Error: ${data.error || "Failed to initiate call"}`);
        setToastType("error");
        setIsCallingCustomer(false);
        setTimeout(() => setShowToast(false), 5000);
      }
    } catch (err) {
      console.error("Error sending feedback:", err);
      setToastMessage("Error connecting to server");
      setToastType("error");
      setIsCallingCustomer(false);
      setTimeout(() => setShowToast(false), 5000);
    }
  };

  // Handle back button
  const handleBack = () => {
    router.push("/dashboard-view");
  };

  // Custom Toast Component
  const CustomToast = ({ visible, message, type }: { visible: boolean, message: string, type: string }) => {
    if (!visible) return null;
    
    const bgColor = 
      type === "success" ? "bg-green-100 border-green-400 text-green-700" :
      type === "error" ? "bg-red-100 border-red-400 text-red-700" :
      "bg-blue-100 border-blue-400 text-blue-700";
      
    const icon = 
      type === "success" ? <CheckCircle className="h-5 w-5 mr-2" /> :
      type === "error" ? <XCircle className="h-5 w-5 mr-2" /> :
      <Info className="h-5 w-5 mr-2" />;
      
    return (
      <div className={`fixed bottom-4 right-4 ${bgColor} border px-4 py-3 rounded shadow-md flex items-center z-50`}>
        {icon}
        {message}
      </div>
    );
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
            
            <div className={`transition-all duration-500 ${leftColumnItems[2] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              <h3 className="text-lg font-semibold mb-2">Recent Activity</h3>
              {userData.last_feedback ? (
                <div className="bg-muted p-3 rounded-md mb-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Last Feedback Sent: {userData.last_feedback_date ? format(new Date(userData.last_feedback_date), "PPP") : "Recently"}
                  </p>
                  <p className="text-sm">{userData.last_feedback}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Summary */}
        <div className="w-1/3 border-r flex flex-col p-4">
          <h2 className="text-xl font-bold mb-4">Summary</h2>
          <div className="flex-1 overflow-auto mb-4 bg-muted/30 rounded-md p-3">
            {analysis ? (
              <p className="text-muted-foreground">{analysis}</p>
            ) : (
              <p className="text-muted-foreground">No call summary available yet.</p>
            )}
          </div>
          <div className="border-t pt-4">
            <h3 className="text-md font-semibold mb-2 flex items-center">
              <Phone className="mr-2 h-4 w-4" /> 
              Employee Feedback
              {isCallingCustomer && (
                <span className="ml-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800">
                  Call in progress
                </span>
              )}
            </h3>
            <Textarea
              placeholder="Enter feedback for the customer..."
              className="min-h-[80px] mb-2"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              disabled={isCallingCustomer}
            />
            <Button 
              className="w-full flex items-center justify-center" 
              onClick={handleSendFeedback}
              disabled={isCallingCustomer || !feedback.trim()}
              variant={isCallingCustomer ? "outline" : "default"}
            >
              <Bell className="mr-2 h-4 w-4" />
              {isCallingCustomer ? "Calling Customer..." : "Notify Customer"}
            </Button>
          </div>
        </div>

        {/* Right Column - Call History */}
        <div className="w-1/3 flex flex-col">
          <div className="border-b p-4">
            <h2 className="text-lg font-semibold">Customer Service History</h2>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {callHistory.length > 0 ? (
              <div className="space-y-4">
                {callHistory.map((message) => {
                  const isCustomer = message.sender === "client";
                  const isSystem = message.sender === "system";

                  // For system messages, display as info card
                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="bg-blue-50 text-blue-800 text-xs py-1 px-3 rounded-full border border-blue-200">
                          {message.message}
                        </div>
                      </div>
                    );
                  }

                  // For customer/assistant messages, display as chat bubbles
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
      
      {/* Toast Notification */}
      <CustomToast 
        visible={showToast} 
        message={toastMessage} 
        type={toastType} 
      />
    </div>
  );
}