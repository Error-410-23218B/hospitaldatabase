"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "ai/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Minimize2,
  Maximize2,
  Phone,
  AlertTriangle,
  Clock,
  MapPin,
  Stethoscope,
} from "lucide-react"

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Quick action buttons
  const quickActions = [
    {
      label: "Book Appointment",
      icon: Clock,
      message: "How can I book an appointment?",
    },
    {
      label: "Emergency Info",
      icon: AlertTriangle,
      message: "What should I do in a medical emergency?",
    },
    {
      label: "Find Department",
      icon: MapPin,
      message: "How can I find a specific department?",
    },
    {
      label: "Services",
      icon: Stethoscope,
      message: "What medical services do you offer?",
    },
  ]

  const handleQuickAction = (message: string) => {
    // Directly set the input value and submit the form
    handleInputChange({ target: { value: message } } as React.ChangeEvent<HTMLInputElement>)
    setTimeout(() => {
      handleSubmit(new Event("submit") as any)
    }, 100)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <MessageCircle className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
        </Button>


      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-96 shadow-2xl border-0 transition-all duration-300 ${isMinimized ? "h-16" : "h-[600px]"}`}>
        {/* Header */}
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold">Medical Assistant</CardTitle>
                <p className="text-xs text-blue-100">St. Mary's Medical Center</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Online status */}
          <div className="flex items-center gap-2 mt-2">
            <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-100">AI Assistant Online</span>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0 flex flex-col h-[calc(600px-120px)]">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <div className="space-y-4">
                  {/* Welcome message */}
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3 max-w-[280px]">
                      <p className="text-sm text-gray-800">
                        Hello! I'm your AI assistant for St. Mary's Medical Center. I can help you with:
                      </p>
                      <ul className="text-xs text-gray-600 mt-2 space-y-1">
                        <li>• Appointment scheduling</li>
                        <li>• Department information</li>
                        <li>• Hospital services</li>
                        <li>• General health questions</li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-2">How can I assist you today?</p>
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium">Quick Actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action.message)}
                          className="h-auto p-2 text-left justify-start"
                        >
                          <action.icon className="h-3 w-3 mr-2 flex-shrink-0" />
                          <span className="text-xs">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Emergency notice */}
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Medical Emergency?</span>
                    </div>
                    <p className="text-xs text-red-700">
                      For immediate medical attention, call 911 or visit our Emergency Department.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Phone className="h-3 w-3 text-red-600" />
                      <span className="text-xs font-medium text-red-800">Emergency: 911</span>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <div key={index} className="flex items-start gap-2">
                  {message.role === "assistant" ? (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div
                      className={`rounded-lg p-3 max-w-[280px] ${
                        message.role === "assistant"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 text-white ml-auto"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatTime(new Date(message.createdAt || Date.now()))}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t p-4">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 text-sm"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {/* Powered by */}
              <div className="flex items-center justify-center mt-2">
                <Badge variant="secondary" className="text-xs">
                  Powered by Google Gemini AI
                </Badge>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
