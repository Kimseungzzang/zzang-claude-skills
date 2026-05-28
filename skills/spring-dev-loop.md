After writing or modifying Spring Boot code, run an independent review via sub-agent, fix issues, write tests, and verify they pass. Repeat until clean or 3 iterations are reached.

---

## Step 1 — Confirm there are changes

```bash
git diff HEAD --stat
git status --short
```

If there are no changes, inform the user and stop.

Collect the full diff to pass to the review sub-agent:

```bash
git diff HEAD
```

---

## Step 2 — Spawn a Review Sub-Agent

Spawn a sub-agent using the Agent tool with the following prompt. Pass the full diff collected in Step 1 as part of the prompt. The sub-agent starts with a fresh context and no knowledge of how the code was written — this gives an independent review.

Use `model: "opus"` for the sub-agent if available.

**Prompt to pass to the sub-agent:**

```
You are a senior Spring Boot engineer performing a code review.
Review the following diff against these rules and classify every finding as Critical, Warning, or Info.

Rules:

Architecture:
- No layer boundary violations (Controller=HTTP only, Service=business logic only, Repository=DB only)
- No Entity exposed in Controller — DTO used for all request/response
- No hardcoded values — enums or constants only
- No Any or Object types
- No null returned or accepted — use Optional or empty collections

Dependency Injection:
- Constructor injection only (@RequiredArgsConstructor + final). No @Autowired field injection.

Transaction:
- @Transactional on Service methods only
- Read-only methods use @Transactional(readOnly = true)
- No self-invocation of @Transactional methods
- No synchronized outside single-threaded context
- Race conditions must be commented

JPA / Persistence:
- No N+1 — use fetch join, @EntityGraph, or separate query
- Bidirectional associations minimized; convenience methods present if used
- State changed via meaningful methods, not setters
- Entity fields have role comments
- Complex queries use QueryDSL

Exception Handling:
- No try-catch in Controller — use @ControllerAdvice
- Custom exceptions must extend RuntimeException

API Design (if applicable):
- Plural nouns, no verbs in URL
- Correct HTTP method
- Unified response format: { "data": ... } / { "code": ..., "message": ... }
- api.md updated if API was added or changed

Severity definitions:
- Critical: rule violation, bug, logic error → must fix
- Warning: improvement opportunity → fix if possible
- Info: style, readability → note only

Diff to review:
{DIFF}

Return a structured list of findings with file, line, severity, and description. If nothing found, state "No issues found."
```

Receive the sub-agent's findings and proceed.

If no Critical or Warning findings → go to Step 3.

If Critical or Warning findings exist:
- Fix all Critical issues.
- Fix Warning issues where practical.
- Re-run Step 2 with the updated diff. **Max 3 iterations.**

After each fix cycle, output:
```
Fixed: [issue description]
Skipped: [issue description] (reason)
```

---

## Step 3 — Write Tests

For each changed class, write the appropriate test:

| Target | Test type | Tool |
|--------|-----------|------|
| Service | Unit test, no Spring context | `@ExtendWith(MockitoExtension.class)` + Mockito |
| Repository | Slice test | `@DataJpaTest` |
| Integration | Full flow | `@SpringBootTest` + TestContainers |

Rules:
- Mock all dependencies in Service tests — no Spring context loaded.
- Cover the happy path and at least one failure/edge case per method.
- If a test already exists for the changed code, update it rather than adding a new one.

---

## Step 4 — Run Tests

```bash
./gradlew test
```

Or if Maven:
```bash
./mvnw test
```

If tests pass → go to Step 5.

If tests fail:
- Fix the failing code or test.
- Re-run. **Max 3 iterations.**
- If still failing after 3 iterations, report to user and stop.

---

## Step 5 — Done

Output a final summary:

---

## Spring Dev Loop Complete

**Review sub-agent iterations**: [N]
**Test iterations**: [N]

**Fixed issues**:
- [list of fixes]

**Tests written/updated**:
- [list of test files]

**Test result**: All passing

---

If max iterations were reached without resolving all issues:

---

## Spring Dev Loop — Max Iterations Reached

**Unresolved review issues**:
- [list]

**Failing tests**:
- [list]

Recommended: review the above items manually before committing.

---
