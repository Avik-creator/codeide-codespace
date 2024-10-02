"use client";
import CreateSpace from "@/components/createSpace";
import ListSpaces from "@/components/listSpaces";
import SignoutButton from "@/components/signoutButton";
import { ModeToggle } from "@/components/toggleTheme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { getSession } from "@/lib/getSession";
import Dockerode from "dockerode";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [spaces, setSpaces] = useState<Dockerode.ContainerInfo[] | []>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<{
    user: {
      name: string;
      email: string;
      id?: string;
    };
  } | null>(null);

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

  return (
    <main className="h-screen py-10 mx-10">
      <header className="flex flex-1 justify-between">
        <h2 className="scroll-m-20 pb-2 text-3xl font-semibold ">let&apos;s create work spaces. 🚀</h2>
        <div className="flex space-x-4">
          <ModeToggle />
          <SignoutButton />
        </div>
      </header>
      <div>
        <Card className="w-full h-full rounded-lg overflow-hidden">
          <div className="flex justify-between px-4 py-2">
            <p className="leading-7 [&:not(:first-child)]:mt-6">Your codespaces</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Create new codespace</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <CreateSpace onSuccess={fetchSpaces} />
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
    </main>
  );
};

export default Dashboard;
