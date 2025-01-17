import Docker from "dockerode";
import mongoose from "mongoose";
import { Container } from "@/models/container"; // Adjust the import path as needed
import connectDB from "@/lib/db";
import { ContainerType } from "@/types";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const docker = new Docker();
  const userId = params.id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return Response.json(
      {
        success: false,
        error: "Invalid or missing user ID",
      },
      { status: 400 }
    );
  }

  try {
    await connectDB();
    // Fetch container details from MongoDB for the specific user
    const userContainerDoc = await Container.findOne({ user: userId }).select(
      "containers numberOfContainers maximumContainers"
    );

    // If no document found, create a new instance of the model to get default values
    if (!userContainerDoc) {
      const defaultDoc = new Container(); // New instance, not saved
      return Response.json(
        {
          success: true,
          data: [],
          numberOfContainers: defaultDoc.numberOfContainers, // Default value
          maximumContainers: defaultDoc.maximumContainers, // Default value
          error: "No containers found for the user",
        },
        { status: 200 }
      );
    }

    // Extract container IDs from the user's container array

    const userContainerIds = userContainerDoc.containers.map((container: ContainerType) => container.containerId);

    // Fetch containers from Docker using the container IDs
    const dockerContainers = await docker.listContainers({
      all: true,
      filters: {
        id: userContainerIds,
        ancestor: ["codeide-frontend"],
      },
    });

    // Combine Docker container info with database container info
    const containersWithDetails = dockerContainers.map(dockerContainer => {
      const dbContainer = userContainerDoc.containers.find((c: ContainerType) => c.containerId === dockerContainer.Id);
      return {
        ...dockerContainer,
        name: dbContainer ? dbContainer.name : null,
      };
    });

    return Response.json({
      success: true,
      data: containersWithDetails,
      numberOfContainer: userContainerDoc.numberOfContainers,
      maximumContainers: userContainerDoc.maximumContainers,
    });
  } catch (error) {
    console.error("Error fetching containers:", error);
    return Response.json(
      {
        success: false,
        error: "An error occurred while fetching containers",
      },
      { status: 500 }
    );
  }
}
