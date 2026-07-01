#!/usr/bin/env tsx
// scripts/validate-api.ts
// Vérifie que les routes API respectent les patterns définis dans CLAUDE.md
// Usage: npx tsx scripts/validate-api.ts

import * as fs from "fs";
import * as path from "path";

const API_DIR = path.join(process.cwd(), "app", "api");

interface Rule {
  name: string;
  test: (content: string, filePath: string) => boolean;
  message: string;
}

// Patterns interdits selon CLAUDE.md
const RULES: Rule[] = [
  {
    name: "no-hardcoded-roles",
    message:
      'Role comparé en dur — utiliser can(role, perm) depuis lib/permissions.ts',
    test: (content) =>
      /role\s*===\s*["'](MAIRE|ADMIN|ADJOINTE|EMPLOYEE|CONTRACTANT)["']/.test(
        content
      ),
  },
  {
    name: "no-raw-date-from-input",
    message:
      "new Date() appelé directement sur une entrée body/params — utiliser parseParisDateTime()",
    test: (content) => /new Date\(\s*(?:body\.|params\.|data\.)/.test(content),
  },
  {
    name: "no-internal-error-leak",
    message:
      "Message d'erreur interne exposé dans la réponse — retourner { error: string } générique",
    test: (content) =>
      /NextResponse\.json\(\s*\{[^}]*(?:message|stack|detail)\s*:/.test(
        content
      ),
  },
  {
    name: "mutation-requires-auth",
    message:
      "Route de mutation (POST/PUT/PATCH/DELETE) sans appel à auth() — toute mutation doit vérifier la session",
    test: (content) => {
      const hasMutation =
        /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\s*\(/.test(
          content
        );
      return hasMutation && !content.includes("auth()");
    },
  },
  {
    name: "no-any-outside-prisma",
    message:
      "Utilisation de `as any` interdite ici — autorisé uniquement dans prisma/",
    test: (content, filePath) => {
      if (filePath.includes("prisma" + path.sep)) return false;
      return /\bas any\b/.test(content);
    },
  },
];

function findRouteFiles(dir: string): string[] {
  const results: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findRouteFiles(fullPath));
    } else if (entry.name === "route.ts") {
      results.push(fullPath);
    }
  }

  return results;
}

function checkFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const issues: string[] = [];

  for (const rule of RULES) {
    if (rule.test(content, filePath)) {
      issues.push(`  ✗ [${rule.name}] ${rule.message}`);
    }
  }

  return issues;
}

function main(): void {
  if (!fs.existsSync(API_DIR)) {
    console.error("❌ Répertoire app/api introuvable");
    process.exit(1);
  }

  const files = findRouteFiles(API_DIR);
  let totalIssues = 0;
  let filesWithIssues = 0;

  console.log(`\n🔍 Validation de ${files.length} route(s) API\n`);

  for (const file of files) {
    const issues = checkFile(file);
    const relPath = path.relative(process.cwd(), file);

    if (issues.length > 0) {
      console.log(`❌ ${relPath}`);
      for (const issue of issues) {
        console.log(issue);
      }
      console.log();
      totalIssues += issues.length;
      filesWithIssues++;
    } else {
      console.log(`✅ ${relPath}`);
    }
  }

  console.log("\n─────────────────────────────────────────");

  if (totalIssues === 0) {
    console.log(`✅ ${files.length} route(s) conformes — aucun problème détecté.\n`);
    process.exit(0);
  } else {
    console.log(
      `❌ ${totalIssues} problème(s) dans ${filesWithIssues} fichier(s) sur ${files.length}.\n`
    );
    process.exit(1);
  }
}

main();
