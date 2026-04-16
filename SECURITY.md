# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**EURL SIREP OASIS NEXUS WEFEH TECH DZ** takes security seriously.

If you discover a security vulnerability, please do NOT open a public GitHub issue.

### How to Report

Send a detailed report to:
- **Email**: skacimo1985@gmail.com
- **Subject**: `[SECURITY] sirep-oasis-nexus-tech-dz - <brief description>`

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

### Response Timeline

- **Acknowledgment**: Within 72 hours
- **Assessment**: Within 7 days
- **Fix/Patch**: Within 30 days (critical issues prioritized)

### Responsible Disclosure

We ask that you:
- Allow us reasonable time to address the issue before public disclosure
- Not exploit the vulnerability beyond what is necessary to demonstrate it
- Not access or modify user data without explicit permission

## Security Measures

This platform implements:
- JWT-based authentication with role-based access control (RBAC)
- End-to-end HTTPS encryption
- Input validation and sanitization
- Rate limiting on API endpoints
- Secrets managed via environment variables (never committed to repo)
- Dependabot automated dependency updates
- GitHub secret scanning enabled

## Legal

Unauthorized access, penetration testing without prior written consent, or any malicious activity against this platform is strictly prohibited and may be prosecuted under Algerian law (Loi 09-04 relative aux infractions liees aux technologies de l'information et de la communication).

---

**Copyright (c) 2026 EURL SIREP OASIS NEXUS WEFEH TECH DZ**  
Marque deposee - INAPI - Tous droits reserves
