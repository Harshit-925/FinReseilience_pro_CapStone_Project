"""
agent_server/start.py — Container entry point.

Starts both services in one process:
  - MCP Server (SSE)  on port 9000  — exposes 4 math engine tools
  - Agent API (FastAPI) on port 9001 — ADK Runner endpoint

KNOWN LIMITATION (intentional for hackathon scope):
  Running the MCP server and agent API in the same container (via background thread)
  is the same class of simplification as the APScheduler in-process limitation
  documented in agent/scheduler.py. In production, these would be split into two
  separate services with independent scaling, health checks, and restart policies.
  The current single-container design is correct for a single-machine docker-compose demo.
"""
from __future__ import annotations

import asyncio
import logging
import os
import subprocess
import sys
import threading
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MCP_PORT = int(os.getenv("MCP_PORT", 9000))

def run_agent_api():
    print("Starting Agent API on port 9001")
    import uvicorn
    uvicorn.run("agent_server.agent_api:app", host="0.0.0.0", port=9001, log_level="info")

def run_mcp_server():
    print(f"Starting MCP server on port {MCP_PORT} (SSE transport) via fastmcp CLI")
    subprocess.Popen([
        "fastmcp", "run", "agent_server.mcp_server:mcp", 
        "--transport", "sse", "--port", str(MCP_PORT)
    ]).wait()

if __name__ == "__main__":
    t1 = threading.Thread(target=run_mcp_server, daemon=True)
    t1.start()
    
    time.sleep(2)
    run_agent_api()
