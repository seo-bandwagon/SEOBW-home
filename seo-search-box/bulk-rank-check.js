const { Client } = require('pg');
const { execSync } = require('child_process');
const fs = require('fs');

const DFS_LOGIN = process.env.DATAFORSEO_LOGIN;
const DFS_PASS = process.env.DATAFORSEO_PASSWORD;
const DATABASE_URL = process.env.DATABASE_URL;

const OUTPUT_DIR = process.env.HOME + '/.openclaw/workspace/outputs/data/serp/mcp-rank-check-2026-03-07';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function serpCheck(keyword) {
  const payload = JSON.stringify([{
    keyword,
    location_code: 2840,
    language_code: "en",
    depth: 100
  }]);
  
  const result = execSync(
    `curl -s -X POST "https://api.dataforseo.com/v3/serp/google/organic/live/regular" ` +
    `--user "${DFS_LOGIN}:${DFS_PASS}" ` +
    `-H "Content-Type: application/json" ` +
    `-d '${payload.replace(/'/g, "'\"'\"'")}'`,
    { timeout: 30000 }
  ).toString();
  
  return JSON.parse(result);
}

function findPosition(data, domain) {
  const items = data?.tasks?.[0]?.result?.[0]?.items || [];
  const clean = domain.replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/+$/, '').toLowerCase();
  for (const item of items) {
    if (item.type !== 'organic') continue;
    const d = (item.domain || '').replace(/^www\./, '').toLowerCase();
    if (d === clean || d.endsWith('.' + clean) || clean.endsWith('.' + d)) {
      return { position: item.rank_group, url: item.url };
    }
  }
  return { position: null, url: null };
}

async function main() {
  const db = new Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await db.connect();

  const { rows } = await db.query(
    `SELECT id, keyword, domain FROM tracked_keywords 
     WHERE (last_checked_at IS NULL OR last_checked_at < NOW() - INTERVAL '7 days')
     AND domain = 'mastercontrolpress.com'
     ORDER BY search_volume_monthly DESC NULLS LAST`
  );

  console.log(`Checking ${rows.length} keywords (highest volume first)...`);
  
  let checked = 0, ranked = 0, errors = 0, totalCost = 0;

  for (const kw of rows) {
    const slug = kw.keyword.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const outFile = `${OUTPUT_DIR}/${slug}.json`;
    
    // Skip if already checked this run (idempotent)
    if (fs.existsSync(outFile)) {
      console.log(`SKIP: ${kw.keyword}`);
      continue;
    }
    
    try {
      const data = serpCheck(kw.keyword);
      const cost = data?.tasks?.[0]?.cost || 0;
      totalCost += cost;
      
      // Save raw response
      fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
      
      const { position, url } = findPosition(data, kw.domain);
      
      await db.query(
        `UPDATE tracked_keywords SET last_position = $1, last_checked_at = NOW() WHERE id = $2`,
        [position, kw.id]
      );
      
      checked++;
      if (position) ranked++;
      
      console.log(`[${checked}/${rows.length}] "${kw.keyword}" → pos ${position ?? 'not ranked'} | $${totalCost.toFixed(3)} spent`);
      
      // 2 second rate limit
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      errors++;
      console.error(`ERROR: "${kw.keyword}" → ${err.message}`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\nDONE: ${checked} checked, ${ranked} ranking, ${errors} errors, $${totalCost.toFixed(3)} spent`);
  await db.end();
}

main().catch(console.error);
