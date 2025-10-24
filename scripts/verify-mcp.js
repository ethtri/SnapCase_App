const { MCPClient } = require("mcp-client");

async function verifyServer(label, options) {
  const client = new MCPClient({
    name: "SnapCase CLI",
    version: "0.1.0",
  });

  try {
    await client.connect({
      type: "stdio",
      ...options,
    });

    const tools = await client.getAllTools();
    const toolNames = tools.map((tool) => tool.name);

    console.log(
      JSON.stringify(
        {
          server: label,
          toolCount: toolNames.length,
          sampleTools: toolNames.slice(0, 5),
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

async function main() {
  await verifyServer("github", {
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      ...process.env,
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PAT,
    },
  });

  await verifyServer("vercel", {
    command: "npx",
    args: ["-y", "vercel-mcp", `VERCEL_API_KEY=${process.env.VERCEL_TOKEN}`],
    env: process.env,
  });

  await verifyServer("stripe", {
    command: "npx",
    args: ["-y", "@stripe/mcp", "--tools=all"],
    env: {
      ...process.env,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    },
  });
}

main().catch((error) => {
  console.error("MCP verification failed:", error);
  process.exit(1);
});
