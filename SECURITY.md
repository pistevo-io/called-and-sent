# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it via:
- GitHub Security Advisory: https://github.com/kkch/called-and-sent/security/advisories/new

**Please do NOT open public issues for security vulnerabilities.**

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |

## Security Measures

### Automated Security
- **Dependabot**: Automatic NPM dependency updates
- **CodeQL**: Code scanning for JavaScript/TypeScript vulnerabilities
- **Contact Form Security**: Cloudflare Worker with rate limiting

### Privacy & Data Protection
- No personal email/phone exposed publicly
- Cloudflare Worker contact form with:
  - Rate limiting (5 submissions/hour per IP)
  - Honeypot spam detection
  - DDoS protection via Cloudflare
  - No database (stateless)

### Best Practices
- HTTPS only
- No sensitive data in repository
- Environment variables for API keys
- Privacy-first design (no tracking without consent)
- Regular dependency updates
