import Docker, { Network } from "dockerode";
import os from "os";

const POST_TO_CONTAINER: {
  [port: string]: Docker.Container | undefined;
} = {};

const CONTAINER_TO_POST: {
  [id: string]: string;
} = {};

export async function POST(request: Request) {
  const { name } = await request.json();
  const docker = new Docker();
  const homedir = os.homedir();

  console.log("start createing container", name);
  console.log("homedir...", homedir);

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

  console.log("finding new port...", availablePort);

  try {
    const image = docker.getImage("codeide-frontend");

    if (!image) {
      console.log("image not found, pulling...");
      await docker.pull("codeide-frontend");
    }

    // ! : if you are not able to create any image then try to run `mkdir ~/.config` manualy

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
      // Env: [`DOCKER_USER=root`],
    });

    POST_TO_CONTAINER[String(availablePort)] = container;
    CONTAINER_TO_POST[container.id] = String(availablePort);

    await container.start();
    console.log("container started...");

    // Waiting for the stream to end before sending the response

    console.info("workspace created... DONE! sending response...");
    // Send the response with the password
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
    console.error("Error:", error);
    // Return a response with an error message
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
