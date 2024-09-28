import Docker from "dockerode";

export async function GET() {
  const docker = new Docker();
  // 87e1b69a3489b5999214387a7e1b5eae7f11ca2422c373cdeb75c76ede5a1f0e
  try {
    const containers = await docker.listContainers({
      all: true,
      filters: {
        ancestor: ["codeide-frontend"],
      },
    });

    return Response.json(containers);
  } catch (error) {
    console.error("Error:", error);
    return Response.json({
      error: error,
    });
  }
}
