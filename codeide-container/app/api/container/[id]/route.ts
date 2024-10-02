import Docker from "dockerode";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

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
    // Get the container
    const container = docker.getContainer(containerId);

    // Get container info to retrieve the image ID

    // Stop the container if it's running
    await container.stop().catch(() => {
      console.log("Error in Stopping the Container");
    });

    // Remove the container
    await container.remove({ force: true });

    // Remove the image

    return Response.json({
      success: true,
      message: "Container and image removed successfully",
    });
  } catch (error) {
    console.error("Error during deletion:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}
