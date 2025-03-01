"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  // State to store form input
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // State for handling messages
  const [message, setMessage] = useState("");

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  // Function to handle register or login
  const handleSubmit = async (e: React.FormEvent, action: "register" | "login") => {
    e.preventDefault();
    setMessage("");

    // Determine endpoint based on action
    const endpoint = action === "register" ? "SignUpEmployee" : "LoginEmployee";

    try {
      const response = await fetch(`http://localhost:5000/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`${action === "register" ? "User registered" : "Login successful"}! Redirecting...`);
        setTimeout(() => router.push("/customer-view"), 2000); // Redirect after 2 sec
      } else {
        setMessage(data.error || "Operation failed");
      }
    } catch (error) {
      setMessage("Something went wrong. Try again.");
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-balance text-muted-foreground">
                  Login or Register for PLACEHOLDER NAME
                </p>
              </div>

              {/* Email field */}
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password field */}
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Buttons for Register and Login */}
              <Button onClick={(e) => handleSubmit(e, "register")} className="w-full">
                Register
              </Button>
              <Button onClick={(e) => handleSubmit(e, "login")} className="w-full">
                Login
              </Button>

              {/* Display message */}
              {message && (
                <p className="text-center text-sm text-red-500">{message}</p>
              )}

              {/* Navigation buttons */}
              <Button asChild className="w-full">
                <Link href="/customer-view">Go to Customer View</Link>
              </Button>
              <Button asChild className="w-full">
                <Link href="/dashboard-view">Go to Dashboard</Link>
              </Button>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
