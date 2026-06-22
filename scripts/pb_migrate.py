"""
PocketBase migration script to create new collections for the agentic upgrade.
Requires Python 3.11+ and httpx.
Run with: python scripts/pb_migrate.py <admin_email> <admin_password> <pb_url>
"""
import asyncio
import sys
import httpx


async def migrate(email: str, password: str, pb_url: str) -> None:
    print(f"Connecting to PocketBase at {pb_url}...")
    
    async with httpx.AsyncClient() as client:
        # 1. Authenticate as admin
        resp = await client.post(
            f"{pb_url}/api/admins/auth-with-password",
            json={"identity": email, "password": password}
        )
        if resp.status_code != 200:
            print(f"Auth failed: {resp.status_code} - {resp.text}")
            sys.exit(1)
            
        token = resp.json()["token"]
        headers = {"Authorization": token, "Content-Type": "application/json"}
        
        # 2. Collections to create
        collections = [
            {
                "name": "chat_sessions",
                "type": "base",
                "system": False,
                "schema": [
                    {"system": False, "id": "cs_user_id", "name": "user_id", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "cs_session_id", "name": "session_id", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "cs_user_msg", "name": "user_message", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "cs_agent_reply", "name": "agent_reply", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "cs_tool_calls", "name": "tool_calls_made", "type": "json", "required": False, "unique": False, "options": {"maxSize": 2000000}}
                ],
                "listRule": "user_id = @request.auth.id",
                "viewRule": "user_id = @request.auth.id",
                "createRule": "user_id = @request.auth.id",
                "updateRule": "user_id = @request.auth.id",
                "deleteRule": "user_id = @request.auth.id",
            },
            {
                "name": "goals",
                "type": "base",
                "system": False,
                "schema": [
                    {"system": False, "id": "g_user_id", "name": "user_id", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "g_title", "name": "title", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "g_target_date", "name": "target_date", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "g_metric_type", "name": "metric_type", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "g_target_value", "name": "target_value", "type": "number", "required": True, "unique": False, "options": {"min": None, "max": None, "noDecimal": False}},
                    {"system": False, "id": "g_current_value", "name": "current_value", "type": "number", "required": False, "unique": False, "options": {"min": None, "max": None, "noDecimal": False}},
                    {"system": False, "id": "g_status", "name": "status", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}}
                ],
                "listRule": "user_id = @request.auth.id",
                "viewRule": "user_id = @request.auth.id",
                "createRule": "user_id = @request.auth.id",
                "updateRule": "user_id = @request.auth.id",
                "deleteRule": "user_id = @request.auth.id",
            },
            {
                "name": "notifications",
                "type": "base",
                "system": False,
                "schema": [
                    {"system": False, "id": "n_user_id", "name": "user_id", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "n_type", "name": "type", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "n_message", "name": "message", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "n_read", "name": "read", "type": "bool", "required": False, "unique": False, "options": {}}
                ],
                "listRule": "user_id = @request.auth.id",
                "viewRule": "user_id = @request.auth.id",
                "createRule": "user_id = @request.auth.id",
                "updateRule": "user_id = @request.auth.id",
                "deleteRule": "user_id = @request.auth.id",
            },
            {
                "name": "whatif_results",
                "type": "base",
                "system": False,
                "schema": [
                    {"system": False, "id": "wi_user_id", "name": "user_id", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "wi_change_desc", "name": "change_description", "type": "text", "required": True, "unique": False, "options": {"min": None, "max": None, "pattern": ""}},
                    {"system": False, "id": "wi_before", "name": "before", "type": "json", "required": True, "unique": False, "options": {"maxSize": 2000000}},
                    {"system": False, "id": "wi_after", "name": "after", "type": "json", "required": True, "unique": False, "options": {"maxSize": 2000000}}
                ],
                "listRule": "user_id = @request.auth.id",
                "viewRule": "user_id = @request.auth.id",
                "createRule": "user_id = @request.auth.id",
                "updateRule": "user_id = @request.auth.id",
                "deleteRule": "user_id = @request.auth.id",
            }
        ]

        for coll in collections:
            resp = await client.post(f"{pb_url}/api/collections", json=coll, headers=headers)
            if resp.status_code in (200, 201):
                print(f"Created collection: {coll['name']}")
            elif resp.status_code == 400 and "already exists" in resp.text.lower():
                print(f"Collection {coll['name']} already exists.")
            else:
                print(f"Failed to create {coll['name']}: {resp.status_code} - {resp.text}")

    print("Migration complete.")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python pb_migrate.py <admin_email> <admin_password> <pb_url>")
        sys.exit(1)
        
    asyncio.run(migrate(sys.argv[1], sys.argv[2], sys.argv[3]))
