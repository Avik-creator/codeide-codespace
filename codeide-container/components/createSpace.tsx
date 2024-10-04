import React, { useEffect, useState } from "react";
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ResponseNewSpace } from "@/types";
import { getSession } from "@/lib/getSession";

export default function CreateSpace({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [expressServer, setExpressServer] = useState("false");
  const [viteServer, setViteServer] = useState("false");
  const [session, setSession] = useState<{
    user: {
      name: string;
      email: string;
      id?: string;
    };
  } | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<{
    url: string;
    expressPORT: number | null;
    vitePORT: number | null;
    id: string;
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

  const createSpace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const trimmedName = name.trim();
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (!alphanumericRegex.test(trimmedName)) {
        setError("Name must contain only letters and numbers.");
        return;
      }

      const response = await fetch("/api/new", {
        method: "POST",
        body: JSON.stringify({
          name: name,
          userId: session?.user.id,
          expressServer: expressServer === "true",
          viteServer: viteServer === "true",
        }),
      });

      const responseData: ResponseNewSpace = await response.json();

      const { data, error } = responseData;
      if (error) {
        setError(error);
        return;
      }
      setResponseData(data);
      onSuccess();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpressServerChange = (value: string) => {
    setExpressServer(value);
    if (value === "true") {
      setViteServer("false");
    }
  };

  const handleViteServerChange = (value: string) => {
    setViteServer(value);
    if (value === "true") {
      setExpressServer("false");
    }
  };

  return responseData ? (
    <div>
      <DialogHeader>
        <DialogTitle>Success!</DialogTitle>
        <DialogDescription>Your codespace has been created successfully.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col space-y-4 mt-2">
        <p>Your codespace is ready! You can access it by clicking the link below.</p>
        <Link href={responseData.url} target="_blank" rel="noreferrer" className="text-blue-500">
          {responseData.url}
        </Link>
        {expressServer === "true" && (
          <p>
            Your Express server is running on port <strong>{responseData.expressPORT}</strong>.
          </p>
        )}
        {viteServer === "true" && (
          <p>
            Your Vite server is running on port <strong>{responseData.vitePORT}</strong>. Some Changes that you need to
            make is to place it in package.json: <strong>&quot;dev&quot;: &quot;vite --host 0.0.0.0&quot;,</strong>
          </p>
        )}
      </div>
      <DialogFooter className="sm:justify-end">
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Close
          </Button>
        </DialogClose>
      </DialogFooter>
    </div>
  ) : (
    <form onSubmit={createSpace} className="w-full space-y-2">
      <DialogHeader>
        <DialogTitle>Create new codespace</DialogTitle>
        <DialogDescription>Create a new codespace with a specific configuration.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col space-y-4">
        <div className="w-full space-y-2">
          <label htmlFor="name">Name Your Space:</label>
          <p className="text-xs">Please make sure your name is unique.</p>
          <Input
            onChange={e => setName(e.target.value)}
            type="text"
            id="name"
            name="name"
            placeholder="Enter your space name"
            disabled={isLoading}
            required
          />
        </div>
        <div className="w-full space-y-2">
          <label htmlFor="expressServer">Will you create an Express Server:</label>
          <Select onValueChange={handleExpressServerChange} value={expressServer}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full space-y-2">
          <label htmlFor="viteServer">Will you create a Vite Server:</label>
          <Select onValueChange={handleViteServerChange} value={viteServer}>
            <SelectTrigger className="w-full" disabled={expressServer === "true"}>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-sm text-muted-foreground">Select only one server option.</p>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <DialogFooter className="sm:justify-end">
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Close
          </Button>
        </DialogClose>
        <Button disabled={isLoading} type="submit">
          {isLoading ? "Creating..." : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}
