"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquare } from "lucide-react";

const Page = () => {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Integrations</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Converastions
            </CardTitle>
            <CardDescription>
              Operator support chat system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access the operator support chat system for managing customer conversations and providing assistance.
            </p>
            <Button 
              onClick={() => window.open("https://echoflow-web.vercel.app/conversations", "_blank")}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Chat
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Page;