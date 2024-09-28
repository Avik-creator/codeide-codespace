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
    console.log(error);
    return Response.json({
      success: false,
      error: error,
    });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const docker = new Docker();

  try {
    await docker.getContainer(params.id).remove();
    return Response.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    return Response.json({
      success: false,
      error: error,
    });
  }
}
