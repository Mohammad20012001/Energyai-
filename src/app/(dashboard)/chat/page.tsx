"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { sendMessage } from "@/app/actions/chat";

// Define the message structure
interface Message {
  role: "user" | "model";
  content: { text: string }[];
}

// Define the message component for rendering
interface DisplayMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: DisplayMessage = { id: `user-${Date.now()}`, text: input, role: "user" };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Construct the history for the AI model
      const history: Message[] = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: [{ text: msg.text }]
      }));

      const response = await sendMessage({ history, prompt: currentInput });
      
      const botMessage: DisplayMessage = { id: `bot-${Date.now()}`, text: response, role: "bot" };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: DisplayMessage = {
        id: `bot-error-${Date.now()}`,
        role: "bot",
        text: "عذراً، حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى."
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
        const scrollableView = scrollAreaRef.current.querySelector('div');
        if(scrollableView) {
           scrollableView.scrollTop = scrollableView.scrollHeight;
        }
    }
  }, [messages]);
  

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
       <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">المساعد الذكي للطاقة الشمسية</h1>
        <p className="text-muted-foreground mt-2">
          اسأل أي شيء عن تصميم أنظمة الطاقة الشمسية، وسأستخدم الأدوات المتاحة لمساعدتك.
        </p>
      </div>
       <Separator className="my-6" />
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                   {message.role === 'bot' && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-lg p-3 max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                   {message.role === 'user' && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
               {isLoading && (
                  <div className="flex items-start gap-4">
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 max-w-lg bg-muted flex items-center">
                       <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="مثال: ما هو حجم السلك المناسب لتيار 15 أمبير ومسافة 20 متر؟"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
