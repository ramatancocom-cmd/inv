import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const bundleDir = path.join(root, "cpanel-bundle");
const standaloneDir = path.join(root, ".next", "standalone");
const staticDir = path.join(root, ".next", "static");
const publicDir = path.join(root, "public");
const dataDir = path.join(root, "data");

console.log("🚀 Preparing cPanel Deployment Package...");

// 1. Verify build exists
if (!fs.existsSync(standaloneDir)) {
  console.error("❌ .next/standalone does not exist! Please run 'npm run build' first.");
  process.exit(1);
}

// 2. Clean and create bundle folder
if (fs.existsSync(bundleDir)) {
  fs.rmSync(bundleDir, { recursive: true, force: true });
}
fs.mkdirSync(bundleDir, { recursive: true });

// 3. Copy standalone server files
console.log("📦 Copying standalone server files...");
fs.cpSync(standaloneDir, bundleDir, { recursive: true });

// 4. Copy static assets to .next/static
console.log("🎨 Copying static assets...");
const destStaticDir = path.join(bundleDir, ".next", "static");
fs.mkdirSync(destStaticDir, { recursive: true });
if (fs.existsSync(staticDir)) {
  fs.cpSync(staticDir, destStaticDir, { recursive: true });
}

// 5. Copy public folder
if (fs.existsSync(publicDir)) {
  console.log("🖼️ Copying public directory...");
  const destPublicDir = path.join(bundleDir, "public");
  fs.mkdirSync(destPublicDir, { recursive: true });
  fs.cpSync(publicDir, destPublicDir, { recursive: true });
}

// 6. Setup data folder
console.log("📝 Ensuring data directory exists...");
const destDataDir = path.join(bundleDir, "data");
fs.mkdirSync(destDataDir, { recursive: true });
if (fs.existsSync(dataDir)) {
  fs.cpSync(dataDir, destDataDir, { recursive: true });
}

// 7. Create app.js alias (many cPanel setups look for app.js or server.js)
console.log("⚙️ Creating app.js alias for Phusion Passenger...");
fs.writeFileSync(
  path.join(bundleDir, "app.js"),
  `// Entry point alias for cPanel Phusion Passenger\nrequire('./server.js');\n`,
  "utf8"
);

// 8. Create production .env file
console.log("🔐 Generating production .env template...");
const envContent = `# Production environment configuration
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Admin password for /admin dashboard
ADMIN_PASSWORD=admin123

# Optional: Gmail notifications for new RSVPs
# GMAIL_USER=your-email@gmail.com
# GMAIL_APP_PASSWORD=your-app-password
`;
fs.writeFileSync(path.join(bundleDir, ".env"), envContent, "utf8");

console.log("✨ Done! Files are ready in: " + bundleDir);
