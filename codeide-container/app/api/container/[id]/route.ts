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

    // Fetch the document to get both containerId and backendContainerId
    const userContainer = await Container.findOne(
      { "containers.containerId": containerId },
      { "containers.$": 1 } // Only retrieve the matching container's data
    );

    if (!userContainer) {
      console.error("Container not found in the database");
      return NextResponse.json(
        {
          success: false,
          message: "Container not found in the database",
        },
        { status: 404 }
      );
    }

    const { containerId: frontendId, backendContainerId } = userContainer.containers[0];

    // Get the containers from Docker
    const frontendContainer = docker.getContainer(frontendId);
    const backendContainer = docker.getContainer(backendContainerId);

    // Remove both frontend and backend containers from Docker
    try {
      // Remove the frontend container
      await frontendContainer.remove({ force: true });

      // Remove the backend container
      if (backendContainerId) {
        await backendContainer.remove({ force: true });
      }
    } catch (removeError) {
      console.error("Error removing Docker containers:", removeError);
      return NextResponse.json(
        {
          success: false,
          message: "Failed to remove Docker containers",
          error: removeError instanceof Error ? removeError.message : "Unknown error",
        },
        { status: 500 }
      );
    }

    // If Docker removal was successful, remove the containers from the database
    const result = await Container.updateOne(
      { "containers.containerId": containerId },
      {
        $pull: { containers: { containerId: containerId } },
        $inc: { numberOfContainers: -1 },
      }
    );

    if (result.modifiedCount === 0) {
      console.warn("Containers removed from Docker but not found in the database");
      return NextResponse.json(
        {
          success: true,
          message: "Containers removed from Docker but not found in the database",
        },
        { status: 200 }
      );
    }

    // Revalidate the dashboard path
    revalidatePath("/dashboard");

    return NextResponse.json({
      success: true,
      message: "Containers removed successfully from both Docker and database",
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
