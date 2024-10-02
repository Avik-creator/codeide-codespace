import Docker from "dockerode";
import mongoose from "mongoose";
import { Container } from "@/models/container"; // Adjust the import path as needed
import connectDB from "@/lib/db";

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
    const userContainerDoc = await Container.findOne({ user: userId }).select("containers");

    const userContainerLength = await Container.findOne({ user: userId }).select("numberOfContainers");

    if (!userContainerDoc || userContainerDoc.containers.length === 0) {
      return Response.json(
        {
          success: true,
          data: [],
          numberOfContainer: userContainerLength,
          error: "No containers found for the user",
        },
        { status: 200 }
      );
    }

    // Extract container IDs from the user's container array
    interface ContainerType {
      containerId: string;
      name?: string;
    }

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
      numberOfContainer: userContainerLength,
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
