# CIVITAS

CIVITAS is an Android and Spring Boot demo for account registration, email verification, tenant setup, and candidate applications. Accounts, tenant records, and candidate submissions are persisted in PostgreSQL.

## Project layout

- `backend/`: Java 17, Spring Boot REST API, Spring Security, JWT, JPA, PostgreSQL.
- `frontend/`: Expo React Native application written in TypeScript, targeting Android.
- `docker-compose.yml`: local PostgreSQL instance.

## Start the API

Install Java 17, Maven 3.9+, and Docker Desktop. From the repository root, start PostgreSQL:

```powershell
docker compose up -d postgres
```

Then run the API from `backend/`:

```powershell
mvn spring-boot:run
```

PostgreSQL defaults match the Compose file. Override `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DRIVER` for another database. Set a private `JWT_SECRET` of at least 32 bytes before sharing the backend. Hibernate uses `ddl-auto: update` for this demo; use schema migrations before deployment.

Without SMTP credentials, development mode writes the OTP to the backend terminal and returns it as `developmentOtp` while `OTP_EXPOSE_IN_DEVELOPMENT=true`. To send real emails, configure `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_SMTP_AUTH=true`, and `MAIL_SMTP_STARTTLS=true`; set `OTP_EXPOSE_IN_DEVELOPMENT=false`. Never expose OTPs in a shared or deployed environment.

## Run the Android app

From `frontend/`, run `npm install` and `npx expo start`. Press `a` to open a connected Android emulator, or scan the QR code with Expo Go. The project uses the Expo CLI bundled with its `expo` dependency; use `npx expo` rather than a separately installed global `expo-cli`.

The API URL is set by `EXPO_PUBLIC_API_URL`. For an Android emulator, use `http://10.0.2.2:8080` (or the configured backend port). For a physical phone, use the computer's LAN IP. The app allows HTTP for local development; use HTTPS before deployment.

## Workflow

1. Register using a name, email, and password.
2. Verify the six digit email code. OTPs are BCrypt hashed, expire, and allow at most five incorrect attempts.
3. Sign in. The API returns a signed JWT used for protected requests.
4. Platform administrators sign in through the separate Admin portal and create society tenants. Regular members cannot create tenants; the API enforces this by role.
5. Candidate applicants use the separate Candidate portal, sign in or create a member account, then submit an application for a tenant. Applications are stored with `PENDING` status.

### Configure the platform admin

There is no public admin registration. Spring Boot imports the ignored `backend/.env` file when launched from `backend/`; use Java-properties syntax without quotes or spaces around `=`, for example `PORT=8081`, `CIVITAS_ADMIN_EMAIL=your-admin@email`, and `CIVITAS_ADMIN_PASSWORD=choose-a-password`. Expo's `frontend/.env` is not read by Spring. The backend provisions that verified `PLATFORM_ADMIN` account at startup, promoting an existing member with the configured email if needed. The configured password is reset to `CIVITAS_ADMIN_PASSWORD` at each startup. Optionally set `CIVITAS_ADMIN_FULL_NAME`. Keep these credentials private and only configure an email intended to hold platform-wide access. Run `mvn spring-boot:run` from `backend/`, then confirm the startup log says the admin was provisioned and Tomcat is listening on 8081.

## API routes

Public:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account and send OTP. Body: `fullName`, `email`, `password`. |
| POST | `/api/auth/verify-email` | Verify code. Body: `email`, `code`. Returns JWT. |
| POST | `/api/auth/resend-otp` | Request a replacement code. Body: `email`. |
| POST | `/api/auth/login` | Sign in with verified email and password. |
| POST | `/api/auth/admin/login` | Separate sign-in for provisioned platform admins only. |
| GET | `/api/health` | API health check. |

Protected routes require `Authorization: Bearer <token>`:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/auth/me` | Read the current member. |
| POST | `/api/auth/logout` | Acknowledge client sign out; client deletes its token. |
| POST | `/api/tenants` | Create tenant. Body: `name`, `code`, `city`. Creator becomes tenant admin. |
| GET | `/api/tenants/mine` | List tenants created by current member. |
| POST | `/api/candidates/register` | Submit candidate. Body: `tenantId`, `contestingPost`, `statement`, optional `phone`. |
| GET | `/api/candidates/mine` | List candidate applications for current member. |

Example registration:

```powershell
Invoke-RestMethod http://localhost:8080/api/auth/register -Method Post -ContentType 'application/json' -Body '{"fullName":"Alex Citizen","email":"alex@example.com","password":"a-strong-demo-password"}'
```

## Scope

This is an early functionality demo, not a production election system. It does not implement voting, voter eligibility checks, tenant-scoped review permissions, election lifecycle, ballot secrecy, immutable audit, request throttling, or legal compliance. Do not use it to conduct a real election. Replace development secrets and credentials, enable HTTPS, configure SMTP, and add database migrations and security controls before deployment.
