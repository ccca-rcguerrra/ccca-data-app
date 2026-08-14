# Auth Rules

## Authentication Flow

```
POST /api/auth/login          → LocalAuthGuard → jwtService.sign() → { access_token, user }
GET  /api/auth/me             → JwtAuthGuard   → returns current user
POST /api/auth/forgot-password → Public          → sends reset email
POST /api/auth/reset-password  → Public          → updates password with token
```

## Decorators

### `@Public()` — Skip JWT auth

```typescript
import { Public } from '../auth/decorators/public.decorator';

@Controller('api/public-resource')
export class PublicController {
  @Get()
  @Public()
  getPublic() { ... }  // No JWT required
}
```

### `@Roles()` — Gate by role

```typescript
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../model/model.enums';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get()
  @Roles(UserRole.ADMIN)
  adminOnly() { ... }  // Only ADMIN role
}
```

## Guards

| Guard | Purpose | Usage |
|-------|---------|-------|
| `JwtAuthGuard` | Validates JWT token | `@UseGuards(JwtAuthGuard)` on controller |
| `LocalAuthGuard` | Validates email/password | POST /api/auth/login only |
| `RolesGuard` | Checks user roles | Add after JwtAuthGuard |
| `WsJwtGuard` | JWT for WebSocket | On `@SubscribeMessage()` handlers |

## Permissions

Defined in `auth/auth.permissions.ts`:

```typescript
import { UserRole } from '../model/model.enums';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: ['*'],
  [UserRole.COORDINATOR]: ['users.manage', 'teams.manage', ...],
  [UserRole.ANALYST_SENIOR]: ['activations.create', ...],
  // ...
  [UserRole.VIEWER]: [],
};
```

## Auth Service Methods

| Method | Purpose |
|--------|---------|
| `login(email, password)` | Validate credentials, return tokens |
| `validateUser(email, password)` | Internal guard call |
| `forgotPassword(email)` | Generate reset token, send email |
| `resetPassword(token, newPassword)` | Validate token, update password |

## Rules

- **`JwtAuthGuard`** is applied at the controller class level — never on individual routes
- **`@Public()`** overrides the class-level guard for specific routes
- **`@Roles()`** requires `RolesGuard` in addition to `JwtAuthGuard`
- **Token expiresIn** is configured in `config/setup/jwt.config.ts` (default: `10y`)
- **WebSocket auth** uses `handshake.auth.token` or `handshake.headers.authorization`
- **Passport strategies**: `LocalStrategy` (email/password), `JwtStrategy` (bearer token)
- **Passport serialization**: Passport is used for guard/protection only — JWT payload is `{ sub: userId, email }`
