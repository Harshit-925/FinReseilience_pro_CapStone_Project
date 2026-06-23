/// <reference path="../pb_data/types.d.ts" />

/**
 * Migration: Create app-specific collections
 * Uses importCollections (merge mode) so existing system collections are preserved.
 * Field objects follow the exact format that PB v0.39.4 generates internally.
 */
migrate(
  (app) => {
    const snapshot = [
      // ------------------------------------------------------------------ //
      // history — stores analysis + AI results per user                     //
      // ------------------------------------------------------------------ //
      {
        "id": "finr_history_col",
        "name": "history",
        "type": "base",
        "system": false,
        "fields": [
          {
            "id": "text3208210256",
            "name": "id",
            "type": "text",
            "system": true,
            "primaryKey": true,
            "autogeneratePattern": "[a-z0-9]{15}",
            "min": 15,
            "max": 15,
            "pattern": "^[a-z0-9]+$",
            "required": true,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "text_history_user",
            "name": "user_id",
            "type": "text",
            "system": false,
            "required": true,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "json_history_engine",
            "name": "engine_result",
            "type": "json",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "json_history_ai",
            "name": "ai_result",
            "type": "json",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "bool_history_fallback",
            "name": "fallback_used",
            "type": "bool",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "autodate2990389176",
            "name": "created",
            "type": "autodate",
            "system": false,
            "onCreate": true,
            "onUpdate": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "autodate3332085495",
            "name": "updated",
            "type": "autodate",
            "system": false,
            "onCreate": true,
            "onUpdate": true,
            "presentable": false,
            "hidden": false
          }
        ],
        "indexes": [],
        "listRule": "user_id = @request.auth.id",
        "viewRule": "user_id = @request.auth.id",
        "createRule": "user_id = @request.auth.id",
        "updateRule": "user_id = @request.auth.id",
        "deleteRule": "user_id = @request.auth.id"
      },

      // ------------------------------------------------------------------ //
      // goals — user financial goals                                         //
      // ------------------------------------------------------------------ //
      {
        "id": "finr_goals_col",
        "name": "goals",
        "type": "base",
        "system": false,
        "fields": [
          {
            "id": "text3208210256",
            "name": "id",
            "type": "text",
            "system": true,
            "primaryKey": true,
            "autogeneratePattern": "[a-z0-9]{15}",
            "min": 15,
            "max": 15,
            "pattern": "^[a-z0-9]+$",
            "required": true,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "text_goals_user",
            "name": "user_id",
            "type": "text",
            "system": false,
            "required": true,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "number_goals_target",
            "name": "target",
            "type": "number",
            "system": false,
            "required": true,
            "presentable": false,
            "hidden": false,
            "min": null,
            "max": null,
            "noDecimal": false
          },
          {
            "id": "date_goals_target_date",
            "name": "target_date",
            "type": "date",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false,
            "min": "",
            "max": ""
          },
          {
            "id": "number_goals_baseline",
            "name": "baseline",
            "type": "number",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false,
            "min": null,
            "max": null,
            "noDecimal": false
          },
          {
            "id": "bool_goals_achieved",
            "name": "achieved",
            "type": "bool",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "autodate2990389176",
            "name": "created",
            "type": "autodate",
            "system": false,
            "onCreate": true,
            "onUpdate": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "autodate3332085495",
            "name": "updated",
            "type": "autodate",
            "system": false,
            "onCreate": true,
            "onUpdate": true,
            "presentable": false,
            "hidden": false
          }
        ],
        "indexes": [],
        "listRule": "user_id = @request.auth.id",
        "viewRule": "user_id = @request.auth.id",
        "createRule": "user_id = @request.auth.id",
        "updateRule": "user_id = @request.auth.id",
        "deleteRule": "user_id = @request.auth.id"
      },

      // ------------------------------------------------------------------ //
      // chat_sessions — AI chat history per user/session                    //
      // ------------------------------------------------------------------ //
      {
        "id": "finr_chat_sessions",
        "name": "chat_sessions",
        "type": "base",
        "system": false,
        "fields": [
          {
            "id": "text3208210256",
            "name": "id",
            "type": "text",
            "system": true,
            "primaryKey": true,
            "autogeneratePattern": "[a-z0-9]{15}",
            "min": 15,
            "max": 15,
            "pattern": "^[a-z0-9]+$",
            "required": true,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "text_cs_user_id",
            "name": "user_id",
            "type": "text",
            "system": false,
            "required": true,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "text_cs_session_id",
            "name": "session_id",
            "type": "text",
            "system": false,
            "required": true,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "text_cs_user_msg",
            "name": "user_message",
            "type": "text",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "text_cs_agent_reply",
            "name": "agent_reply",
            "type": "text",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "json_cs_tool_calls",
            "name": "tool_calls_made",
            "type": "json",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "autodate2990389176",
            "name": "created",
            "type": "autodate",
            "system": false,
            "onCreate": true,
            "onUpdate": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "autodate3332085495",
            "name": "updated",
            "type": "autodate",
            "system": false,
            "onCreate": true,
            "onUpdate": true,
            "presentable": false,
            "hidden": false
          }
        ],
        "indexes": [],
        "listRule": "user_id = @request.auth.id",
        "viewRule": "user_id = @request.auth.id",
        "createRule": "user_id = @request.auth.id",
        "updateRule": "user_id = @request.auth.id",
        "deleteRule": "user_id = @request.auth.id"
      },

      // ------------------------------------------------------------------ //
      // notifications — user in-app notifications                           //
      // ------------------------------------------------------------------ //
      {
        "id": "finr_notifications",
        "name": "notifications",
        "type": "base",
        "system": false,
        "fields": [
          {
            "id": "text3208210256",
            "name": "id",
            "type": "text",
            "system": true,
            "primaryKey": true,
            "autogeneratePattern": "[a-z0-9]{15}",
            "min": 15,
            "max": 15,
            "pattern": "^[a-z0-9]+$",
            "required": true,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "text_notif_user_id",
            "name": "user_id",
            "type": "text",
            "system": false,
            "required": true,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "text_notif_type",
            "name": "type",
            "type": "text",
            "system": false,
            "required": true,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "text_notif_message",
            "name": "message",
            "type": "text",
            "system": false,
            "required": true,
            "presentable": false,
            "hidden": false,
            "autogeneratePattern": "",
            "min": 0,
            "max": 0,
            "pattern": ""
          },
          {
            "id": "bool_notif_read",
            "name": "read",
            "type": "bool",
            "system": false,
            "required": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "autodate2990389176",
            "name": "created",
            "type": "autodate",
            "system": false,
            "onCreate": true,
            "onUpdate": false,
            "presentable": false,
            "hidden": false
          },
          {
            "id": "autodate3332085495",
            "name": "updated",
            "type": "autodate",
            "system": false,
            "onCreate": true,
            "onUpdate": true,
            "presentable": false,
            "hidden": false
          }
        ],
        "indexes": [],
        "listRule": "user_id = @request.auth.id",
        "viewRule": "user_id = @request.auth.id",
        "createRule": "user_id = @request.auth.id",
        "updateRule": "user_id = @request.auth.id",
        "deleteRule": "user_id = @request.auth.id"
      }
    ];

    return app.importCollections(snapshot, false);
  },
  (app) => {
    const names = ["history", "goals", "chat_sessions", "notifications"];
    for (const name of names) {
      try {
        app.delete(app.findCollectionByNameOrId(name));
      } catch (_) {}
    }
  }
);
