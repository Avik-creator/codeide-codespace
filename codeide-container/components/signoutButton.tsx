"use client";

import { ShadowOuterIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getSession } from "@/lib/getSession";

export default function SignoutButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [session, setSession] = useState<{
    user: {
      name: string;
      email: string;
    };
  } | null>(null);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ redirectTo: "/" });
    setIsSigningOut(false);
  };

  useEffect(() => {
    async function fetchSession() {
      const session1 = await getSession();

      if (session1) {
        setSession({
          user: {
            name: session1.user?.name as string,
            email: session1?.user?.email as string,
          },
        });
      }
    }
    fetchSession();
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{session?.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuItem className="flex-col items-start">
          <div className="text-sm font-medium">{session?.user.name}</div>
          <div className="text-xs text-muted-foreground">{session?.user.email}</div>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut} disabled={isSigningOut}>
            <ShadowOuterIcon className="mr-2 h-4 w-4" />
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
