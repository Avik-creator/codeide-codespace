import connectDB from "@/lib/db";
import { Container } from "@/models/container";
import { NextResponse } from "next/server";
import Docker from "dockerode";
import { revalidatePath } from "next/cache";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  await connectDB();

  const containerExists = await Container.exists({ "containers.containerId": id });

  if (!containerExists) {
    return Response.json({
      error: "Container not found",
    });
  }

  const docker = new Docker();

  try {
    const container = docker.getContainer(id);
    const containerInfo = await container.inspect();

    return Response.json(containerInfo);
  } catch (error) {
    return Response.json({
      error: error,
    });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { action } = await request.json();
  const docker = new Docker();

  try {
    if (action === "stop") {
      await docker.getContainer(params.id).stop();
      await docker.getContainer(params.id);
    } else {
      await docker.getContainer(params.id).start();
    }
    return Response.json({
      success: true,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error,
    });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const docker = new Docker();
  const containerId = params.id;

  try {
    // Connect to the database
    await connectDB();

    // Get the container
    const container = docker.getContainer(containerId);

    // Remove the container from Docker
    try {
      await container.remove({ force: true });
    } catch (removeError) {
      console.error("Error removing Docker container:", removeError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to remove Docker container",
          error: removeError instanceof Error ? removeError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // If Docker removal was successful, remove it from the database
    const result = await Container.updateOne(
      { "containers.containerId": containerId },
      {
        $pull: { containers: { containerId: containerId } },
      }
    );

    if (result.modifiedCount === 0) {
      console.warn("Container removed from Docker but not found in the database");
      return NextResponse.json(
        {
          success: true,
          message: "Container removed from Docker but not found in the database",
        },
        { status: 200 }
      );
    }

    // Revalidate the dashboard path
    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
      message: "Container removed successfully from both Docker and database",
    });
  } catch (error) {
    console.error("Error during deletion:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
