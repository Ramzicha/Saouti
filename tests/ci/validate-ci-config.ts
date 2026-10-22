import fs from 'node:fs';
import path from 'node:path';

function validateCiConfig() {
  const ciPath = path.resolve(process.cwd(), '.github/workflows/ci.yml');
  if (!fs.existsSync(ciPath)) {
    throw new Error(`.github/workflows/ci.yml does not exist at ${ciPath}`);
  }

  const content = fs.readFileSync(ciPath, 'utf8');

  // Check 5 required jobs
  const requiredJobs = ['lint', 'type-check', 'test', 'build', 'secret-scan'];
  for (const job of requiredJobs) {
    const jobRegex = new RegExp(`^\\s{2}${job}:`, 'm');
    if (!jobRegex.test(content)) {
      throw new Error(`Missing required CI job: '${job}'`);
    }
  }

  // Check coverage flag in test job
  if (!content.includes('test:coverage') && !content.includes('--coverage')) {
    throw new Error(
      "CI 'test' job does not enforce coverage (missing test:coverage or --coverage)",
    );
  }

  // Check secret scan uses gitleaks
  if (!content.includes('gitleaks/gitleaks-action')) {
    throw new Error(
      "CI 'secret-scan' job does not use gitleaks/gitleaks-action",
    );
  }

  // Check pnpm setup / cache
  if (!content.includes('pnpm/action-setup') && !content.includes('cache:')) {
    throw new Error('CI workflow is missing pnpm setup or caching');
  }

  console.log(
    '✅ CI workflow validation passed: all 5 jobs and security checks verified.',
  );
}

try {
  validateCiConfig();
} catch (err: any) {
  console.error(`❌ CI Configuration validation failed: ${err.message}`);
  process.exit(1);
}
