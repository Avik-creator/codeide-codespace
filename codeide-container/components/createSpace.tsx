import React, { useState } from "react";
import { DialogClose, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import Link from "next/link";
import { ResponseNewSpace } from "@/types";

const CreateSpace = ({ onSuccess }: { onSuccess: () => void }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseData, setResponseData] = useState<{
    url: string;
    password: string;
    id: string;
  } | null>(null);

  const createSpace = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const trimmedName = name.trim();
      const alphanumericRegex = /^[a-zA-Z0-9]+$/;
      if (!alphanumericRegex.test(trimmedName)) {
        setError("name must contain only letters and numbers.");
        return;
      }

      const response = await fetch("/api/new", {
        method: "POST",
        body: JSON.stringify({ name: name }),
      });

      const responseData: ResponseNewSpace = await response.json();
      console.log("responseData", responseData);
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
      <div className="flex  items-center space-x-2">
        <div className="w-full my-4 space-y-4">
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
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
      <DialogFooter className="sm:justify-end">
        <DialogClose asChild>
          <Button type="button" variant="secondary">
            Close
          </Button>
        </DialogClose>
        <Button disabled={isLoading} type="submit">
          {isLoading ? "Createing..." : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default CreateSpace;
