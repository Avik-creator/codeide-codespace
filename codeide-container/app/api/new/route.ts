import Docker from "dockerode";
import { Container } from "@/models/container"; // Adjust the import path as needed
import connectDB from "@/lib/db";
import { execSync } from "node:child_process";

function getOccupiedPorts() {
  const occupiedPorts = new Set();

  try {
    // For Linux or MacOS
    const result = execSync("netstat -tuln | awk '{print $4}' | grep -Eo '[0-9]+$'").toString();
    result.split("\n").forEach(port => {
      if (port) {
        occupiedPorts.add(parseInt(port, 10));
      }
    });
  } catch (error) {
    console.error("Error fetching occupied ports:", error);
  }

  return occupiedPorts;
}

function allocatePort(minPort: number, maxPort: number) {
  const occupiedPorts = getOccupiedPorts();

  for (let i = minPort; i <= maxPort; i++) {
    if (!occupiedPorts.has(i)) {
      return i;
    }
  }

  throw new Error("No available ports in the specified range");
}

function PORT() {
  return allocatePort(9010, 9999);
}

function EXPRESSPORT() {
  return allocatePort(3010, 3999);
}

function VITEPORT() {
  return allocatePort(5174, 5999);
}

function getAvailablePort() {
  return allocatePort(3006, 3009);
}

// NEXT_PUBLIC_BACKEND_PORT=9000
// NEXT_PUBLIC_VITE_PORT=5173
// NEXT_PUBLIC_EXPRESS_PORT=3001

export async function POST(request: Request) {
  const { name, userId, expressServer, viteServer } = await request.json();
  console.log(name, userId);
  const docker = new Docker();

  try {
    await connectDB();

    const backendPORT = PORT();
    const availablePort = await getAvailablePort();
    const expressPORT = EXPRESSPORT();
    const vitePORT = VITEPORT();

    const image = docker.getImage("codeide-frontend");
    const backendImage = docker.getImage("codeide-server");
    if (!image || !backendImage) {
      await docker.pull("codeide-frontend");
      await docker.pull("codeide-server");
    }

    const container = await docker.createContainer({
      Image: "codeide-frontend",
      name: name,
      Env: [
        `NEXT_PUBLIC_BACKEND_PORT=${backendPORT}`,
        ...(expressServer ? [`NEXT_PUBLIC_EXPRESS_PORT=${expressPORT}`] : []),
        ...(viteServer ? [`NEXT_PUBLIC_VITE_PORT=${vitePORT}`] : []),
      ],

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
        ...(viteServer && { "5173/tcp": {} }), // Conditionally expose port 5173
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
          ...(viteServer && {
            "5173/tcp": [
              {
                HostPort: String(vitePORT), // Ensure availablePort is a string
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

      console.log("Adding container to existing user's containers array", backendContainer.id);

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
        containers: [{ containerId: container.id, name: name, backendContainerId: backendContainer.id }],
      });
      newContainer.numberOfContainers = 1;
      await newContainer.save();
    }

    return Response.json(
      {
        success: true,
        data: {
          url: `http://${container.id.slice(0, 12)}-${availablePort}.localhost:3005`,
          backendURL: `http://${backendContainer.id.slice(0, 12)}-${backendPORT}.localhost:3005`,
          id: container.id.slice(0, 12),
          expressPORT: expressServer ? expressPORT : null,
          vitePORT: viteServer ? vitePORT : null,
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
