"use client";

import { useEffect, useState } from "react";
import CreateSpace from "@/components/createSpace";
import ListSpaces from "@/components/listSpaces";
import SignoutButton from "@/components/signoutButton";
import { ModeToggle } from "@/components/toggleTheme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { getSession } from "@/lib/getSession";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Dockerode from "dockerode";

const MAX_SPACES = 5;

export default function Dashboard() {
  const [spaces, setSpaces] = useState<Dockerode.ContainerInfo[] | []>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [numberOfSContainers, setNumberOfSContainers] = useState(0);
  const [session, setSession] = useState<{
    user: {
      name: string;
      email: string;
      id?: string;
    };
  } | null>(null);
  const [showLimitAlert, setShowLimitAlert] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      const session1 = await getSession();
      if (session1) {
        setSession({
          user: {
            name: session1.user?.name as string,
            email: session1?.user?.email as string,
            id: session1?.user?.id as string,
          },
        });
      }
    }
    fetchSession();
  }, []);

  const fetchSpaces = async () => {
    if (!session?.user.id) {
      console.log("User ID not available yet");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/listcontainers/${session.user.id}`);
      const data = await response.json();

      setNumberOfSContainers(data.numberOfContainer.numberOfContainers);
      setSpaces(data.data || []);
    } catch (error) {
      console.error("Error fetching spaces:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user.id) {
      fetchSpaces();
    }
  }, [session]);

  const spaceCount = numberOfSContainers;

  const progressPercentage = (spaceCount / MAX_SPACES) * 100;

  const handleCreateSpace = () => {
    if (numberOfSContainers >= MAX_SPACES) {
      setShowLimitAlert(true);
    }
  };

  return (
    <main className="h-screen py-10 mx-10">
      <header className="flex flex-1 justify-between mb-6">
        <h2 className="scroll-m-20 pb-2 text-3xl font-semibold ">let&apos;s create work spaces. 🚀</h2>
        <div className="flex space-x-4">
          <ModeToggle />
          <SignoutButton />
        </div>
      </header>
      <div className="mb-6">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-lg font-medium">Codespace Usage</p>
            <p className="text-sm">{`${spaceCount}/${MAX_SPACES}`}</p>
          </div>
          <Progress value={progressPercentage} className="w-full" />
        </Card>
      </div>
      <div>
        <Card className="w-full h-full rounded-lg overflow-hidden">
          <div className="flex justify-between px-4 py-2">
            <p className="leading-7 [&:not(:first-child)]:mt-6">Your codespaces</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={handleCreateSpace}>Create new codespace</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                {spaceCount < MAX_SPACES ? (
                  <CreateSpace onSuccess={fetchSpaces} />
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      You have reached the maximum limit of {MAX_SPACES} codespaces. Please delete an existing codespace
                      to create a new one.
                    </AlertDescription>
                  </Alert>
                )}
              </DialogContent>
            </Dialog>
          </div>
          <Card className="w-full rounded-none border-r-0 border-l-0 border-b-0 border-t overflow-hidden">
            {spaces.length > 0 ? (
              spaces.map((space, index) => <ListSpaces key={index} fetchSpaces={fetchSpaces} space={space} />)
            ) : isLoading ? (
              <div className="w-full p-4 flex justify-center items-center">Loading...</div>
            ) : (
              <Card className="w-full p-4 flex justify-center items-center">
                <p className="leading-7 [&:not(:first-child)]:mt-6">No codespaces found.</p>
              </Card>
            )}
          </Card>
        </Card>
      </div>
      {showLimitAlert && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Limit Reached</AlertTitle>
          <AlertDescription>
            You have reached the maximum limit of {MAX_SPACES} codespaces. Please upgrade your plan to create more.
          </AlertDescription>
        </Alert>
      )}
    </main>
  );
}
