Apply these rules when writing or reviewing Spring Boot code.

## Architecture

- Enforce layer boundaries — Controller handles HTTP only, Service handles business logic only, Repository handles DB only. Never skip layers.
- DTO ↔ Entity conversion happens in the Service layer — Controller must not receive or return Entities directly.
- No hardcoding — use enums or dedicated constant types.
- Never use `Any` or `Object` types.
- Never return or allow `null` — use `Optional` or empty collections instead.

## Dependency Injection

- Constructor injection only — `@Autowired` field injection is forbidden. Use `@RequiredArgsConstructor` + `final` fields.
- Avoid overusing `@Component` — use `@Service`, `@Repository`, `@Configuration` explicitly.

## Transaction

- `@Transactional` belongs in the Service layer only — never on Repository or Controller.
- Use `@Transactional(readOnly = true)` for read-only operations — skips flush, improves performance.
- Be aware of self-invocation — calling a `@Transactional` method from within the same bean bypasses the proxy.
- `synchronized` is only valid in single-threaded environments — do not use it otherwise.
- Always be aware of potential race conditions. If one exists, leave a comment explaining it.
- Always ask the user before introducing async processing (`@Async`, `CompletableFuture`, etc.).

## JPA / Persistence

- Always resolve N+1 problems — use `fetch join`, `@EntityGraph`, or a separate query.
- Minimize bidirectional associations — unidirectional is usually sufficient. If bidirectional is needed, always manage `mappedBy` and provide a convenience method.
- Apply Rich Domain Model — change state through meaningful methods, not setters.
- Leave a comment on each Entity field explaining its role.
- Use QueryDSL for complex queries — easier to debug and maintain.

## Exception Handling

- Centralize exception handling with `@ControllerAdvice` + `@ExceptionHandler` — no scattered try-catch in Controllers.
- Convert checked exceptions to unchecked — custom exceptions must extend `RuntimeException` (Spring rolls back on `RuntimeException`).

## Testing

- Unit-test Services without the Spring context — `@SpringBootTest` loads the full app; use Mockito only for Service tests.
- Use `@DataJpaTest` for Repository tests — loads only JPA-related beans to verify queries and JPQL.
- Use TestContainers for integration tests — do not hide behavior behind in-memory H2; verify against the real DB dialect.
- When modifying code, update affected tests as well.
- Always write tests alongside new code.

## Configuration

- Use `application-{profile}.yml` per environment — secrets go in environment variables, never committed to git.
- Prefer `@ConfigurationProperties` over `@Value` — group related config into a type-safe binding class.

## API Design

### URL
- Use plural nouns — `/users`, `/orders/{id}`, `/orders/{id}/items`
- No verbs in URLs — `/getUser` (X) → `GET /users/{id}` (O)
- Lowercase + hyphens — `/user-profiles` (O), `/userProfiles` (X)
- Max 3 levels deep — `/a/b/c/d` signals a design problem

### HTTP Methods
- `GET` — read, idempotent, no side effects
- `POST` — create
- `PUT` — full replacement (idempotent)
- `PATCH` — partial update
- `DELETE` — remove (idempotent)

### Response Format
- Use a single unified format for success and error responses.
- Use HTTP status codes meaningfully — at minimum distinguish 200/201/400/401/403/404/409/500.
- Error responses must include `code` + `message`.

```json
// Success
{ "data": { ... } }

// Error
{ "code": "USER_NOT_FOUND", "message": "..." }
```

### Request / Response DTO
- Accept requests via `@RequestBody` DTO — never receive Entities directly.
- Return response DTOs — never expose Entities (risk of circular reference and sensitive data leakage).
- Validate in the DTO — use `@Valid` with `@NotNull`, `@Size`, etc.

### Versioning
- Use URL versioning (`/v1/users`) — visible and explicit.
- Add `/v1` from day one — adding it later breaks existing clients.

### API Documentation
- Whenever an API is created or modified, update the `api.md` file in the project root.
