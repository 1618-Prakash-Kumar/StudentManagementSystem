# Backend image storage configuration

Product images are stored in Cloudinary and referenced from the existing
`product_images` PostgreSQL table. The application stores each Cloudinary
secure URL and public ID; it does not rely on Render's ephemeral filesystem.

## Required environment variables

Configure these values for the backend process. Do not put the API secret in
the frontend or commit credentials to source control.

| Variable | Value |
| --- | --- |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

The existing `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET`
environment variables remain required for the backend.

## Local development

Create a Cloudinary account, then set the values in the terminal used to start
Spring Boot. For PowerShell:

```powershell
$env:CLOUDINARY_CLOUD_NAME = "your-cloud-name"
$env:CLOUDINARY_API_KEY = "your-api-key"
$env:CLOUDINARY_API_SECRET = "your-api-secret"
$env:DB_URL = "jdbc:postgresql://localhost:5432/campus_exchange"
$env:DB_USERNAME = "your-database-user"
$env:DB_PASSWORD = "your-database-password"
$env:JWT_SECRET = "your-long-random-jwt-secret"
.\mvnw.cmd spring-boot:run
```

The app can start without Cloudinary configured, but image upload requests
return `503 Service Unavailable` until all three Cloudinary variables are set.
Product listings without images continue to work.
In IntelliJ IDEA, set the same three values under **Run → Edit Configurations
→ Environment variables** for the Spring Boot run configuration, then restart
the backend.

## Render deployment

In the Render backend service's **Environment** settings, add the three
Cloudinary values above, alongside the existing database and JWT settings.
Redeploy the backend after saving. The configured JPA schema update adds or
extends the `product_images` metadata columns without deleting existing
products. Render's local disk is not used for image persistence.

## Upload constraints and API

Images must be JPEG or PNG, at most 5 MB each, no larger than 6000 × 6000
pixels or 20 megapixels, and at most five per listing. Uploads require JWT
authentication. Product owners and admins may add/remove images; only existing
product owner/admin permissions apply.

- `POST /api/products` accepts existing JSON requests unchanged, or multipart
  form data with a JSON `product` part and optional repeated `images` parts.
- `POST /api/products/{id}/images` accepts one multipart `image` part.
- `GET /api/products/{id}/images` returns the persisted image IDs and URLs as
  JSON; it reads PostgreSQL and does not require Cloudinary credentials.
- `DELETE /api/products/{id}/images/{imageId}` removes the image reference and
  the Cloudinary asset.

Product responses include backward-compatible `imageUrls` and `thumbnailUrl`
fields. Product deletion removes stored Cloudinary assets where the provider
is configured.
