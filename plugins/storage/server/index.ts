import { existsSync, mkdirSync } from "node:fs";
import env from "@server/env";
import Logger from "@server/logging/Logger";
import {
  PluginManager,
  PluginPriority,
  Hook,
} from "@server/utils/PluginManager";
import router from "./api/files";

if (env.FILE_STORAGE === "local") {
  const rootDir = env.FILE_STORAGE_LOCAL_ROOT_DIR;
  try {
    if (!existsSync(rootDir)) {
      mkdirSync(rootDir, { recursive: true });
      Logger.debug("utils", `Created ${rootDir} for local storage`);
    }
  } catch (err) {
    Logger.fatal(
      `Failed to create directory for local file storage at ${env.FILE_STORAGE_LOCAL_ROOT_DIR}`,
      err
    );
  }
}

// Register the file upload/serve routes for local storage, and also for S3 so
// browsers can upload through the app. Cloudflare R2 does not support the S3
// presigned POST that direct-to-bucket uploads rely on, so those uploads are
// proxied via /api/files.create (which stores server-side with PUT).
const enabled = !!(
  env.FILE_STORAGE_UPLOAD_MAX_SIZE &&
  (env.FILE_STORAGE === "s3" ||
    (env.FILE_STORAGE_LOCAL_ROOT_DIR && env.FILE_STORAGE === "local"))
);

if (enabled) {
  PluginManager.add([
    {
      name: "File storage",
      description: "Proxy upload and serve routes for local and S3 storage",
      type: Hook.API,
      value: router,
      priority: PluginPriority.Normal,
    },
  ]);
}
