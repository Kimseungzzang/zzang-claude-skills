Guide commit message writing using Conventional Commits format.

## Commit Message Structure

```
<type>(<scope>): <subject>

<body>
```

## Types

| type | usage |
|------|-------|
| `feat` | new feature |
| `fix` | bug fix |
| `refactor` | code change with no behavior change |
| `test` | add or update tests |
| `docs` | documentation only |
| `chore` | build, config, dependency changes |
| `perf` | performance improvement |

## Subject Rules

- 50 characters or less
- Start with a present-tense verb
- No trailing period
- English or Korean — consistency within the team matters

## Body (optional)

- Explain WHY, not what — the diff explains what
- Wrap at 72 characters per line

## Examples

```
feat(user): add email verification API
fix(order): prevent order creation when stock is 0
refactor(auth): extract JWT validation into separate class
test(payment): add unit tests for payment failure cases
chore: upgrade spring-boot to 3.2.0
```

## When Helping Write Commit Messages

1. Read `git diff --staged` or review the changes provided.
2. Choose the most appropriate type and scope.
3. Summarize the change in one concise subject line.
4. Add a body if the WHY is non-obvious.
5. Propose one message as the primary suggestion; offer alternatives if asked.
