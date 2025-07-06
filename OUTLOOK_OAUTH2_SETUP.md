# How to Obtain OAuth2 Credentials for Outlook SMTP with Nodemailer

Follow these steps to register an app in Azure, configure permissions, create secrets, and obtain the refresh token needed for OAuth2 authentication with Nodemailer.

## 1. Register an Application in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com).
2. Navigate to **Azure Active Directory** > **App registrations**.
3. Click **New registration**.
4. Enter a name for your app (e.g., "Nodemailer SMTP App").
5. Select supported account types (usually "Accounts in this organizational directory only").
6. Click **Register**.

## 2. Configure API Permissions

1. In your app registration, go to **API permissions**.
2. Click **Add a permission**.
3. Select **Microsoft Graph**.
4. Choose **Delegated permissions**.
5. Search for and add **Mail.Send** permission.
6. Click **Add permissions**.
7. Click **Grant admin consent** for your organization.

## 3. Create a Client Secret

1. Go to **Certificates & secrets**.
2. Click **New client secret**.
3. Add a description and set an expiration.
4. Click **Add**.
5. Copy the client secret value immediately (you won't see it again).

## 4. Get Tenant ID and Client ID

1. In the app overview, copy the **Application (client) ID**.
2. Copy the **Directory (tenant) ID**.

## 5. Obtain a Refresh Token

You need to perform the OAuth2 authorization code flow to get a refresh token.

### Using Postman (recommended)

1. Create a new request in Postman.
2. Use the following authorization URL in a browser, replacing placeholders:

```
https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/authorize?
client_id={client_id}
&response_type=code
&redirect_uri={redirect_uri}
&response_mode=query
&scope=https://graph.microsoft.com/.default offline_access
&state=12345
```

- `{tenant_id}`: Your tenant ID.
- `{client_id}`: Your client ID.
- `{redirect_uri}`: A redirect URI you registered (can be `https://localhost`).

3. After login, you will get a code in the redirect URL.
4. Exchange the code for tokens by POSTing to:

```
https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token
```

With form data:

- client_id: your client ID
- scope: https://graph.microsoft.com/.default offline_access
- code: the code from previous step
- redirect_uri: same as above
- grant_type: authorization_code
- client_secret: your client secret

5. The response will include `access_token` and `refresh_token`.

### Using a Script

You can use libraries like `simple-oauth2` in Node.js to automate this flow.

## 6. Set Environment Variables

Add the following to your `.env` file:

```
OUTLOOK_EMAIL=your_outlook_email@example.com
OUTLOOK_CLIENT_ID=your_client_id
OUTLOOK_CLIENT_SECRET=your_client_secret
OUTLOOK_TENANT_ID=your_tenant_id
OUTLOOK_REFRESH_TOKEN=your_refresh_token
```

## 7. Restart Your Development Server

Make sure to restart your server to load the new environment variables.

---

If you need help with any of these steps or a sample script to automate token generation, please ask!
