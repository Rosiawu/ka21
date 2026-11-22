import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

export default defineCloudflareConfig({
	// Keep build-time SSG pages in Workers Static Assets so ordinary page
	// reads do not execute the Next.js server function.
	incrementalCache: staticAssetsIncrementalCache,
	enableCacheInterception: true,
});
