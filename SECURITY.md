# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of TREMOR.LIVE seriously. If you discover a security vulnerability, please follow these steps:

### 1. DO NOT Create a Public Issue

Please **do not** create a public GitHub issue for security vulnerabilities. This helps prevent malicious exploitation before a fix is available.

### 2. Report Privately

Send your report to: security@tremor.live

Include the following information:
- Type of vulnerability
- Full paths of affected source files
- Steps to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact assessment

### 3. Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution Target**: 30-90 days depending on severity

### 4. Severity Levels

We classify vulnerabilities as:

- **Critical**: Remote code execution, authentication bypass
- **High**: Data exposure, privilege escalation
- **Medium**: Cross-site scripting, CSRF
- **Low**: Information disclosure, denial of service

## Security Best Practices

When contributing to TREMOR.LIVE:

### Environment Variables
- Never commit `.env` files
- Use `.env.example` for documentation
- Rotate keys if accidentally exposed

### API Keys
- Store all keys in environment variables
- Never hardcode credentials
- Use minimal permission scopes

### Dependencies
- Keep dependencies updated
- Review security advisories
- Use `pnpm audit` regularly

### Data Handling
- Sanitize user inputs
- Validate data from external APIs
- Use HTTPS for all external requests

## Responsible Disclosure

We support responsible disclosure:

1. Reporter submits vulnerability privately
2. We acknowledge and investigate
3. We develop and test a fix
4. We release the fix
5. We publicly credit the reporter (if desired)

## Security Features

TREMOR.LIVE implements:

- Environment-based configuration
- No authentication required (read-only public data)
- Rate limiting on API endpoints
- Input validation on all user inputs
- Secure communication with Convex backend
- No storage of personal user data

## Contact

For security concerns, contact: security@tremor.live

For general issues, use: https://github.com/sculptdotfun/tremor/issues

## Acknowledgments

We thank all security researchers who responsibly disclose vulnerabilities.