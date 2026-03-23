import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LLMS_TXT_URL = 'https://doc.halo-platform.net/llms.txt';

async function fetchLlmsTxt() {
    console.log(`Fetching ${LLMS_TXT_URL}...`);
    try {
        const response = await fetch(LLMS_TXT_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${LLMS_TXT_URL}: ${response.status} ${response.statusText}`);
        }
        return await response.text();
    } catch (error) {
        console.error('Error fetching llms.txt:', error);
        process.exit(1);
    }
}

function parseLlmsTxt(text) {
    const lines = text.split('\n');
    const versions = new Map(); // version -> { comm: [], rqrs: [] }

    // Regex to match: "- PolarHub Schema 2025.6 > comm [Name](url)" or "- PolarHub Schema 2025.6 [Name](url)"
    const lineRegex = /^- PolarHub Schema (\d+\.\d+)\s*(> comm )?\[([\w_]+)\]\(([^)]+)\)/;

    lines.forEach(line => {
        const match = line.match(lineRegex);
        if (!match) return;

        const version = match[1];
        const isComm = !!match[2]; // match[2] is "> comm "
        const name = match[3];
        const url = match[4];

        if (!versions.has(version)) {
            versions.set(version, { comm: [], rqrs: [] });
        }

        if (isComm) {
            versions.get(version).comm.push({ name, url });
        } else {
            versions.get(version).rqrs.push({ name, url });
        }
    });

    // Find latest version
    const sortedVersions = Array.from(versions.keys()).sort((a, b) => parseFloat(b) - parseFloat(a));
    if (sortedVersions.length === 0) {
        console.error('No schema versions found in llms.txt');
        process.exit(1);
    }

    const latestVersion = sortedVersions[0];
    console.log(`Latest Schema Version: ${latestVersion}`);

    return {
        version: latestVersion,
        ...versions.get(latestVersion),
    };
}

async function main() {
    const text = await fetchLlmsTxt();
    const index = parseLlmsTxt(text);

    const outputPath = path.join(__dirname, '../spec/schema-llms-index.json');
    const specDir = path.dirname(outputPath);

    await fs.mkdir(specDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(index, null, 2), 'utf8');

    console.log(`Schema index saved to ${outputPath}`);
    console.log(`Comm schemas: ${index.comm.length}`);
    console.log(`RQ/RS schemas: ${index.rqrs.length}`);
}

main();
