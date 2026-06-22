/// <reference path="../pb_data/types.d.ts" />

/**
 * PocketBase Migration: Create core collections
 * Collections: history, goals, reports
 * All with user-scoped API rules: user = @request.auth.id
 */
migrate(
  (app) => {
    // --- history collection ---
    const history = new Collection({
      name: "history",
      type: "base",
      fields: [
        {
          name: "user",
          type: "relation",
          required: true,
          options: {
            collectionId: "_pb_users_auth_",
            cascadeDelete: true,
            maxSelect: 1,
          },
        },
        {
          name: "engine_result",
          type: "json",
          required: true,
        },
        {
          name: "ai_result",
          type: "json",
          required: false,
        },
        {
          name: "fallback_used",
          type: "bool",
          required: false,
        },
      ],
      listRule: "user = @request.auth.id",
      viewRule: "user = @request.auth.id",
      createRule: "user = @request.auth.id",
      updateRule: "user = @request.auth.id",
      deleteRule: "user = @request.auth.id",
    });
    app.save(history);

    // --- goals collection ---
    const goals = new Collection({
      name: "goals",
      type: "base",
      fields: [
        {
          name: "user",
          type: "relation",
          required: true,
          options: {
            collectionId: "_pb_users_auth_",
            cascadeDelete: true,
            maxSelect: 1,
          },
        },
        {
          name: "target",
          type: "number",
          required: true,
        },
        {
          name: "target_date",
          type: "date",
          required: false,
        },
        {
          name: "baseline",
          type: "number",
          required: true,
        },
        {
          name: "achieved",
          type: "bool",
          required: false,
        },
      ],
      listRule: "user = @request.auth.id",
      viewRule: "user = @request.auth.id",
      createRule: "user = @request.auth.id",
      updateRule: "user = @request.auth.id",
      deleteRule: "user = @request.auth.id",
    });
    app.save(goals);

    // --- reports collection ---
    const reports = new Collection({
      name: "reports",
      type: "base",
      fields: [
        {
          name: "user",
          type: "relation",
          required: true,
          options: {
            collectionId: "_pb_users_auth_",
            cascadeDelete: true,
            maxSelect: 1,
          },
        },
        {
          name: "file",
          type: "file",
          required: true,
          options: {
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ["application/pdf"],
          },
        },
      ],
      listRule: "user = @request.auth.id",
      viewRule: "user = @request.auth.id",
      createRule: "user = @request.auth.id",
      updateRule: "user = @request.auth.id",
      deleteRule: "user = @request.auth.id",
    });
    app.save(reports);
  },
  (app) => {
    // Rollback
    const collections = ["reports", "goals", "history"];
    for (const name of collections) {
      const col = app.findCollectionByNameOrId(name);
      app.delete(col);
    }
  }
);
