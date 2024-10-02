import React, { useState } from "react";
import { Card } from "./ui/card";
import Dockerode from "dockerode";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

const ListSpaces = ({ space, fetchSpaces }: { space: Dockerode.ContainerInfo; fetchSpaces: () => void }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);

  const actionContainer = async (action: "stop" | "start", id: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/container/${id}`, {
        method: "POST",
        body: JSON.stringify({ action: action }),
      });
      const data = await response.json();
      if (data.success) {
        fetchSpaces();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteContainer = async (id: string) => {
    setRemoveLoading(true);
    try {
      const response = await fetch(`/api/container/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        fetchSpaces();
      }
    } catch (error) {
      console.log(error);
    } finally {
      setRemoveLoading(false);
    }
  };
  return (
    <Card className="w-full p-4 flex justify-between items-center rounded-none border-r-0 border-l-0 border-b-0 border-t">
      <div>
        <div className="flex items-center">
          <p className="text-lg font-semibold mr-2">{space.Names[0].replace("/", "")}</p>
          {" - "}
          <p className="text-muted-foreground text-xs mx-2">{space.Id.slice(0, 12)}</p>
        </div>
        <div className="flex items-center">
          <div className="text-sm text-gray-500">
            {space.State === "running" ? (
              <div className="size-2 rounded-full bg-green-600"></div>
            ) : (
              <div className="size-2 rounded-full bg-gray-400"></div>
            )}
          </div>
          <p className="ml-2">
            {space.State === "running" ? "Running" : "Not running"} - {space.Status} {" - "}
          </p>
        </div>
      </div>
      <div className="space-x-3">
        {space.State === "running" ? (
          <Tooltip>
            <TooltipTrigger>
              <Button disabled={space.State === "running"} variant={"outline"}>
                Remove
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>cannot remove running container.</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Dialog>
            <DialogTrigger asChild>
              <Button disabled={space.State === "running"} variant={"outline"}>
                {removeLoading ? "Remove..." : "Remove"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Attention</DialogTitle>
                <DialogDescription>are you sure you want to delete space?</DialogDescription>
              </DialogHeader>
              <div className="flex items-center space-x-2"></div>
              <DialogFooter className="sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    Close
                  </Button>
                </DialogClose>
                <Button type="submit" onClick={() => deleteContainer(space.Id)}>
                  {removeLoading ? "Delete..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        <Button
          variant={"outline"}
          onClick={() => {
            actionContainer(space.State === "running" ? "stop" : "start", space.Id);
          }}
          disabled={actionLoading}
        >
          {space.State === "running" ? (actionLoading ? "Stop..." : "Stop") : actionLoading ? "Start..." : "Start"}
        </Button>

        {space.State === "running" ? (
          <Button asChild>
            <Link href={`http://${space.Id.slice(0, 12)}-${space.Ports[0].PublicPort}.localhost:3005`} target="_blank">
              Open
            </Link>
          </Button>
        ) : (
          <Button variant={"outline"} disabled>
            shutdown
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ListSpaces;
