import Docker from "dockerode";

import { Container } from "@/models/container"; // Adjust the import path as needed

const POST_TO_CONTAINER: {
  [port: string]: Docker.Container | undefined;
} = {};
const CONTAINER_TO_POST: {
  [id: string]: string;
} = {};

export async function POST(request: Request) {
  const { name, userId } = await request.json();
  const docker = new Docker();

  const minPort = 8000;
  const maxPort = 8999;
  let availablePort = null;
  for (let port = minPort; port <= maxPort; port++) {
    if (!POST_TO_CONTAINER[port]) {
      availablePort = port;
      break;
    }
  }
  if (!availablePort) {
    return new Response(JSON.stringify({ error: "No available ports" }), {
      status: 500,
    });
  }

  try {
    const image = docker.getImage("codeide-frontend");
    if (!image) {
      await docker.pull("codeide-frontend");
    }

    const container = await docker.createContainer({
      Image: "codeide-frontend",
      name: name,
      HostConfig: {
        PortBindings: {
          "3000/tcp": [
            {
              HostIp: "127.0.0.1",
              HostPort: availablePort.toString(),
              Network: "codeide-network",
            },
          ],
        },
      },
    });

    POST_TO_CONTAINER[String(availablePort)] = container;
    CONTAINER_TO_POST[container.id] = String(availablePort);
    await container.start();

    // Store container information in MongoDB
    const newContainer = new Container({
      containerId: container.id,
      name: name,
      user: userId,
    });
    await newContainer.save();

    return Response.json(
      {
        success: true,
        data: {
          url: `http://${container.id.slice(0, 12)}-${availablePort}.localhost:3005`,
          id: container.id.slice(0, 12),
        },
        error: null,
      },
      {
        status: 200,
      }
    );
  } catch (error: any) {
    const message = error?.json?.message;
    return Response.json(
      {
        success: false,
        data: null,
        error: message || "An error occurred while creating the container",
      },
      {
        status: 500,
      }
    );
  }
}
