import Docker from "dockerode";
import { Container } from "@/models/container"; // Adjust the import path as needed
import connectDB from "@/lib/db";

const backendPort = new Set();
const expressPORT = new Set();
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

function PORT() {
  const minPort = 9000;
  const maxPort = 9999;

  for (let i = minPort; i <= maxPort; i++) {
    if (!backendPort.has(i)) {
      backendPort.add(i);
      return i;
    }
  }
}

function EXPRESSPORT() {
  const minPort = 3000;
  const maxPort = 3999;

  for (let i = minPort; i <= maxPort; i++) {
    if (!expressPORT.has(i)) {
      expressPORT.add(i);
      return i;
    }
  }
}

export async function POST(request: Request) {
  const { name, userId, expressServer } = await request.json();
  console.log(name, userId);
  const docker = new Docker();

  try {
    await connectDB();

    const backendPORT = PORT();
    const availablePort = await getAvailablePort();

    const image = docker.getImage("codeide-frontend");
    const backendImage = docker.getImage("codeide-server");
    if (!image || !backendImage) {
      await docker.pull("codeide-frontend");
      await docker.pull("codeide-server");
    }

    const container = await docker.createContainer({
      Image: "codeide-frontend",
      name: name,
      Env: [`NEXT_PUBLIC_BACKEND_PORT=${backendPORT}`],

      HostConfig: {
        PortBindings: {
          "3000/tcp": [
            {
              HostPort: availablePort.toString(), // Ensure availablePort is a string
              Network: "codeide-network",
            },
          ],
        },
      },
    });

    const backendContainer = await docker.createContainer({
      Image: "codeide-server",
      name: `${name}-backend`,
      ExposedPorts: {
        "9000/tcp": {},
        ...(expressServer && { "3000/tcp": {} }), // Conditionally expose port 3000
      },
      HostConfig: {
        PortBindings: {
          "9000/tcp": [
            {
              HostPort: String(backendPORT), // Use backendPORT directly, ensure it's a string
              Network: "codeide-network",
            },
          ],
          ...(expressServer && {
            "3000/tcp": [
              {
                HostPort: String(expressPORT), // Ensure availablePort is a string
                Network: "codeide-network",
              },
            ],
          }),
        },
      },
    });
    await backendContainer.start();
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
        backendContainerId: backendContainer.id,
      });
      existingUserContainer.numberOfContainers += 1;
      await existingUserContainer.save();
    } else {
      // Create a new document for the user if it doesn't exist
      const newContainer = new Container({
        user: userId,
        containers: [{ containerId: container.id, name: name, port: availablePort }],
        backendContainerId: backendContainer.id,
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
          expressPORT: expressServer ? expressPORT : null,
        },
        error: null,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("An error occurred while creating the container", error);
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
