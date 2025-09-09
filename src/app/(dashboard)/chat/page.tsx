"use client";

import { useState } from "react";
import { Send, User, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface Message {
  id: string;
  text: string;
  role: "user" | "bot";
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { id: `user-${Date.now()}`, text: input, role: "user" };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // TODO: Connect to backend
    await new Promise(resolve => setTimeout(resolve, 1500));
    const botMessage: Message = { id: `bot-${Date.now()}`, text: "مرحبًا! أنا هنا لمساعدتك في كل ما يخص الطاقة الشمسية. كيف يمكنني خدمتك اليوم؟ (ملاحظة: ما زلت قيد التطوير!)", role: "bot" };
    setMessages(prev => [...prev, botMessage]);


    setIsLoading(false);
  };

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
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}>
                   {message.role === 'bot' && (
                    <Avatar className="w-8 h-8 border">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`rounded-lg p-3 max-w-lg ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm">{message.text}</p>
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
                placeholder="مثال: كم عدد الألواح التي أحتاجها لفاتورة شهرية قيمتها 50 دينار؟"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
