import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_DIR = path.resolve(__dirname, '../logs');

console.log(`🔍 Watching ${LOG_DIR} for new API logs...`);
console.log('Press Ctrl+C to stop\n');

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Map to track processed files to avoid duplicates
const processedFiles = new Set();

/**
 * Recursively watch directory
 * Note: fs.watch recursive option is supported on macOS
 */
fs.watch(LOG_DIR, { recursive: true }, (eventType, filename) => {
    if (eventType === 'rename' && filename && filename.endsWith('.json')) {
        const filePath = path.join(LOG_DIR, filename);

        // Check if it's a new file (not deletion)
        if (fs.existsSync(filePath) && !processedFiles.has(filePath)) {
            // Small delay to ensure file is fully written
            setTimeout(() => {
                processFile(filePath);
                processedFiles.add(filePath);
                // Keep set size manageable
                if (processedFiles.size > 100) {
                    const first = processedFiles.values().next().value;
                    processedFiles.delete(first);
                }
            }, 100);
        }
    }
});

function processFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (!content) return;

        const data = JSON.parse(content);

        const timestamp = data.timestamp || new Date().toISOString();
        const type = data.type || (filePath.includes('RQ') ? 'RQ' : 'RS');
        const apiName = data.apiName || path.basename(filePath).replace(/\.(RQ|RS)\.json$/, '').replace(/^\d+\./, '');
        const txId = data.transactionId || path.basename(path.dirname(filePath));

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`${type === 'RQ' ? '📨' : '📩'} [${timestamp}] ${apiName} ${type}`);
        console.log(`🆔 TX: ${txId}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Print data content
        const output = JSON.stringify(data.data || data, null, 2);
        const lines = output.split('\n');
        console.log(lines.slice(0, 50).join('\n'));
        if (lines.length > 50) {
            console.log('... (truncated)');
        }
        console.log('\n');
    } catch (error) {
        // Ignore errors (like empty files while writing)
    }
}

