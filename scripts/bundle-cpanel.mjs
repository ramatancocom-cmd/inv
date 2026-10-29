import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const root = process.cwd();
const outDir = path.join(root, "out");
const bundleDir = path.join(root, "cpanel-shared-ready");
const zipPath = path.join(root, "invitation-cpanel-ready.zip");

console.log("🚀 Building cPanel Ready Package with 'assets' folder...");

// 1. Ensure out exists
if (!fs.existsSync(outDir)) {
  console.log("Running npm run build...");
  execSync("npm run build", { stdio: "inherit" });
}

// 2. Clean and recreate bundle directory
if (fs.existsSync(bundleDir)) {
  fs.rmSync(bundleDir, { recursive: true, force: true });
}
fs.mkdirSync(bundleDir, { recursive: true });

// 3. Copy everything from out
console.log("📋 Copying static export from out/...");
fs.cpSync(outDir, bundleDir, { recursive: true });

// 4. Rename _next to assets
const oldNext = path.join(bundleDir, "_next");
const newAssets = path.join(bundleDir, "assets");
if (fs.existsSync(oldNext)) {
  console.log("🔄 Renaming _next to assets (LiteSpeed & cPanel friendly)...");
  // Copy to assets
  fs.cpSync(oldNext, newAssets, { recursive: true });
  // Also keep _next as fallback
}

// 5. Replace all references to /_next/ with /assets/
console.log("🔍 Updating asset paths across all HTML, JS, CSS files...");
function replaceRecursively(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      replaceRecursively(fullPath);
    } else if (/\.(html|js|css|json|txt)$/i.test(entry.name)) {
      let content = fs.readFileSync(fullPath, "utf8");
      if (content.includes("/_next/") || content.includes("_next/")) {
        content = content.replace(/\/_next\//g, "/assets/");
        content = content.replace(/_next\//g, "assets/");
        fs.writeFileSync(fullPath, content, "utf8");
      }
    }
  }
}
replaceRecursively(bundleDir);

// 6. Admin directory fallback
console.log("📂 Creating admin/ directory fallback...");
const adminDir = path.join(bundleDir, "admin");
fs.mkdirSync(adminDir, { recursive: true });
fs.copyFileSync(path.join(bundleDir, "admin.html"), path.join(adminDir, "index.html"));

// 7. Copy PHP API scripts
console.log("🐘 Packaging PHP API endpoints...");
const apiDir = path.join(bundleDir, "api");
fs.mkdirSync(apiDir, { recursive: true });
const sourceApi = path.join(root, "api");
if (fs.existsSync(sourceApi)) {
  fs.cpSync(sourceApi, apiDir, { recursive: true });
}

// Create deep directory index.php fallbacks
const rsvpAdminDir = path.join(apiDir, "rsvp", "admin");
const wishesAdminDir = path.join(apiDir, "wishes", "admin");
fs.mkdirSync(rsvpAdminDir, { recursive: true });
fs.mkdirSync(wishesAdminDir, { recursive: true });

fs.writeFileSync(
  path.join(apiDir, "rsvp", "index.php"),
  "<?php require_once dirname(__DIR__) . '/rsvp.php';\n"
);
fs.writeFileSync(
  path.join(rsvpAdminDir, "index.php"),
  "<?php require_once dirname(dirname(__DIR__)) . '/rsvp-admin.php';\n"
);
fs.writeFileSync(
  path.join(apiDir, "wishes", "index.php"),
  "<?php require_once dirname(__DIR__) . '/wishes.php';\n"
);
fs.writeFileSync(
  path.join(wishesAdminDir, "index.php"),
  "<?php require_once dirname(dirname(__DIR__)) . '/wishes-admin.php';\n"
);

// 8. Data directory
console.log("💾 Setting up data/ storage directory...");
const dataDir = path.join(bundleDir, "data");
fs.mkdirSync(dataDir, { recursive: true });

const txtFile = path.join(dataDir, "rsvps.txt");
if (!fs.existsSync(txtFile)) {
  fs.writeFileSync(
    txtFile,
    "# Mohamed & Rawan Wedding - RSVP Submissions Log\r\n# Format: Timestamp | Name | Status | Guests | Message\r\n"
  );
}
const jsonFile = path.join(dataDir, "rsvps.json");
if (!fs.existsSync(jsonFile)) {
  fs.writeFileSync(jsonFile, "[]");
}
const wishesFile = path.join(dataDir, "wishes.json");
if (!fs.existsSync(wishesFile)) {
  fs.writeFileSync(wishesFile, "[]");
}
fs.writeFileSync(
  path.join(dataDir, ".htaccess"),
  "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Order deny,allow\n  Deny from all\n</IfModule>\n"
);

// 9. Root .htaccess for LiteSpeed / Apache
console.log("⚙️ Writing root .htaccess...");
const htaccessContent = `# cPanel / LiteSpeed Shared Hosting Configuration
RewriteEngine On
RewriteBase /

# 1. API routes routing to PHP backend scripts
RewriteRule ^api/rsvp/?$ api/rsvp.php [L,QSA]
RewriteRule ^api/rsvp/admin/?$ api/rsvp-admin.php [L,QSA]
RewriteRule ^api/wishes/?$ api/wishes.php [L,QSA]
RewriteRule ^api/wishes/admin/?$ api/wishes-admin.php [L,QSA]

# 2. Block direct browser access to data folder
RewriteRule ^data(/.*)?$ - [F,L]

# 3. Compatibility: Redirect any remaining _next requests to assets
RewriteRule ^_next/(.*)$ assets/$1 [L]

# 4. Don't rewrite actual files or directories
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# 5. Clean URLs for HTML pages (/admin -> admin.html)
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

# 6. Default directory index
DirectoryIndex index.html index.php

# 7. Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript application/json image/svg+xml
</IfModule>

# 8. Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 month"
  ExpiresByType image/jpeg "access plus 1 month"
  ExpiresByType image/png "access plus 1 month"
  ExpiresByType image/webp "access plus 1 month"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
`;

fs.writeFileSync(path.join(bundleDir, ".htaccess"), htaccessContent);
fs.writeFileSync(path.join(root, ".htaccess"), htaccessContent);

// 10. Zip archive
console.log("📦 Creating invitation-cpanel-ready.zip...");
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

// Use python to create clean, standard zip archive
const pythonScript = `
import zipfile, os

zip_path = r"${zipPath}"
source_dir = r"${bundleDir}"

with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk(source_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, source_dir).replace('\\\\', '/')
            zipf.write(full_path, rel_path)

print(f"Zip created successfully: {os.path.getsize(zip_path)} bytes")
`;

fs.writeFileSync("make_zip.py", pythonScript);
execSync("python make_zip.py", { stdio: "inherit" });
fs.unlinkSync("make_zip.py");

console.log("✅ Successfully built invitation-cpanel-ready.zip!");
