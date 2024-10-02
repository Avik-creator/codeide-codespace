import Docker from "dockerode";
import { Container } from "@/models/container"; // Adjust the import path as needed
import connectDB from "@/lib/db";

// We'll use the database to store port assignments
async function getAvailablePort() {
  const minPort = 8000;
  const maxPort = 8999;

  // Get all existing port assignments
  const containers = await Container.find({}, "containers.port");
  const usedPorts = new Set(containers.flatMap(c => c.containers.map((container: { port: number }) => container.port)));

  for (let port = minPort; port <= maxPort; port++) {
    if (!usedPorts.has(port)) {
      return port;
    }
  }

  throw new Error("No available ports");
}

export async function POST(request: Request) {
  const { name, userId } = await request.json();
  console.log(name, userId);
  const docker = new Docker();

  try {
    await connectDB();

    const availablePort = await getAvailablePort();

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

    await container.start();

    // Fetch the user's container document
    const existingUserContainer = await Container.findOne({ user: userId });

    if (existingUserContainer) {
      // Check if a container with the same name already exists for the user
      const containerExists = existingUserContainer.containers.some((c: { name: string }) => c.name === name);
      if (containerExists) {
        await container.stop();
        await container.remove();
        return new Response(
          JSON.stringify({
            error: `Container with the name '${name}' already exists for this user`,
          }),
          { status: 400 }
        );
      }

      // Add the new container to the existing user's containers array
      existingUserContainer.containers.push({
        containerId: container.id,
        name: name,
        port: availablePort,
      });
      existingUserContainer.numberOfContainers += 1;
      await existingUserContainer.save();
    } else {
      // Create a new document for the user if it doesn't exist
      const newContainer = new Container({
        user: userId,
        containers: [{ containerId: container.id, name: name, port: availablePort }],
        port: availablePort,
      });
      newContainer.numberOfContainers = 1;
      await newContainer.save();
    }

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
  } catch {
    const message = "An error occurred while creating the container";
    return Response.json(
      {
        success: false,
        data: null,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}
