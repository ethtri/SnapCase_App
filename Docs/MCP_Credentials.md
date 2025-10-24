# MCP Credential Management

This reference explains where MCP-connected services obtain their credentials, how to rotate them, and how coding agents should use the servers in day-to-day work.

## Environment Variables

| Service | Variable | Description | Source |
| --- | --- | --- | --- |
| GitHub | `GITHUB_PAT` | Personal access token for MCP tooling and automation. | Generated 2025-10-23 with scopes `repo`, `read:org`. |
| Vercel | `VERCEL_TOKEN` | Personal access token for Vercel API access. | Generated 2025-10-22 from the Vercel Tokens page. |
| Stripe (sandbox) | `STRIPE_SECRET_KEY` | Test-mode secret key for MCP and CLI automation. | `sk_test_51SLCJyIgkqWZOXtbjwR41wTFaavXftqXZKPTUWU2nEqN7YKCayTHM8HjmlF24unhbE5fYQGHLklpRm1h6eBTWzwO00Tlwh19NB` |
| Stripe (sandbox) | `STRIPE_PUBLISHABLE_KEY` | Test-mode publishable key for client simulations. | `pk_test_51SLCJyIgkqWZOXtbx6FLJOZDswTcZfeVFS9AeghvDVBLRq4RTUW1mTZxSV1Dez4wfHqNEmb9MEs934DEszvl6H1h001bfivm7F` |

These variables are defined at the Windows user level via `setx`, so newly opened shells inherit them automatically. Re-open existing terminals after updates.

## MCP Configuration

- `C:\Users\ethtr\.cursor\mcp.json` references the GitHub PAT through `$env:GITHUB_PAT`.
- Cursor connects to hosted MCP endpoints for Vercel (`https://mcp.vercel.com`) and Stripe (`https://mcp.stripe.com`) and handles OAuth/token exchange automatically.
- CLI agents can reuse the same credentials by exporting them in the current session and launching the servers directly with `npx @modelcontextprotocol/server-github`, `npx vercel-mcp`, or `npx @stripe/mcp --tools=all`.

## Usage Guidelines

1. **Inside Cursor**
   - Check the Tools panel before each session; all MCP entries should be green. Toggle any red server off/on to re-authenticate.
   - In a chat, clearly state the task (for example, "Use the Vercel MCP to list my projects"). Provide project IDs, deployment IDs, or Stripe customer IDs when relevant.
   - Log out and regenerate tokens if Cursor prompts for OAuth or reports unauthorized errors.
2. **From CLI agents**
   - Ensure the environment variables above are present (`echo $env:GITHUB_PAT`, etc.). If a value is empty, re-run the relevant `setx` command or export it for the session.
   - Run `node scripts/verify-mcp.js` to confirm all three servers respond. The script enumerates tool counts so you can catch authentication issues quickly.
   - For custom automation, adapt `scripts/verify-mcp.js` to call `client.callTool()` with the desired MCP tool and arguments.
3. **When MCP tools add value**
   - Use **GitHub MCP** for repository automation (branch checks, file edits) when you need API access without wiring GitHub REST calls.
   - Use **Vercel MCP** to inspect deployments, environment variables, or domains directly from the agent workflow.
   - Use **Stripe MCP** for sandbox customer/product setup or validation during payment-flow development.

## Rotation and Production Cutover

- **GitHub:** Visit GitHub → Settings → Developer settings → Personal access tokens to regenerate. Update `GITHUB_PAT`, restart Cursor, and reopen terminal sessions.
- **Vercel:** Regenerate tokens under Vercel → Settings → Tokens. Replace `VERCEL_TOKEN` and reload the MCP server.
- **Stripe:** We currently use sandbox keys. Before switching to live data, create new `sk_live_*` and `pk_live_*` keys under Stripe → Developers → API keys, update environment variables, and re-authenticate the MCP server.

## Risks and Follow-ups

- Live Stripe keys must never be committed or shared in plaintext. Move them to a secrets manager (1Password, Bitwarden, Azure Key Vault, etc.) when production access is required.
- Track token expirations (GitHub PAT expires after 90 days by default) to avoid sudden MCP outages.
- Consider extending CI to run `npm run verify:mcp` with masked secrets to catch authentication problems early.
