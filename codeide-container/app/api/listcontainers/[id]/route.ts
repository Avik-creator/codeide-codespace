import Docker from "dockerode";
import mongoose from "mongoose";
import { Container } from "@/models/container"; // Adjust the import path as needed

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
    // Fetch container IDs from MongoDB for the specific user
    const userContainers = await Container.find({ user: userId }).select("containerId name");
    if (!userContainers || userContainers.length === 0) {
      return Response.json(
        {
          success: false,
          error: "No containers found for the user",
        },
        { status: 400 }
      );
    }
    const userContainerIds = userContainers.map(container => container.containerId);

    // Fetch containers from Docker
    const dockerContainers = await docker.listContainers({
      all: true,
      filters: {
        id: userContainerIds,
        ancestor: ["codeide-frontend"],
      },
    });

    // Combine Docker container info with database info
    const containersWithDetails = dockerContainers.map(dockerContainer => {
      const dbContainer = userContainers.find(c => c.containerId === dockerContainer.Id);
      return {
        ...dockerContainer,
        name: dbContainer ? dbContainer.name : null,
      };
    });

    return Response.json({
      success: true,
      data: containersWithDetails,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "An error occurred while fetching containers",
      },
      { status: 500 }
    );
  }
}
