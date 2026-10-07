# Project-Scoped Rules: Development Workflow & Engineering Standards

These workspace rules define the permanent quality constraints, output formats, testing procedures, refactoring standards, and AI safety criteria.

---

## 1. General Principles
- **Quality Over Speed**: Never optimize for speed; always optimize for production quality.
- **Composition over Inheritance**: Maintain modular structures with typed properties.
- **No Placeholders**: Never commit raw skeletons, empty implementations, or mock overrides.

---

## 2. Output Format Constraints
Every coding task must produce:
1. **Goal**: Target feature goals.
2. **Analysis**: Affected components and system dependencies checks.
3. **Implementation Plan**: Proposed alterations.
4. **Files to Create or Modify**: Link maps.
5. **Code**: Full production-grade modifications.
6. **Tests**: Pytest suites and unit checkpoints.
7. **Documentation Updates**: Updated READMEs or docs folders.
8. **Manual Testing Steps**: Exact console validation steps.
9. **Future Improvements**: Scalability recommendations.

---

## 3. Security & Validation Checklist
- **No Committed Secrets**: API tokens, credentials, and passwords reside in secure env profiles.
- **Header Protections**: Rate limiters and security headers protect public and CMS routes.
- **Interceptors**: Log filters scrub sensitive data (API keys, authorization headers) before writing log records.

---

## 4. Testing & Verification Suites
- **Coverage**: Critical modules require 90%+ total coverage.
- **Scope**: Write API endpoint checks for REST controllers, service integration tests for sync workers, and unit tests for database repositories.

---

## 5. Refactoring & Code Quality
- **DRY & SRP**: Restrict functions to single responsibilities and keep files short.
- **Imports Control**: Prevent circular imports and maintain isort groupings.
- **Comments Rule**: Comment *Why* code behaves in a particular way, never *What* it does.
