// send-push-notification Edge Function
// Deno/Supabase Edge Function for sending FCM v1 push notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PROJECT_ID = "bisafit-bd3f5";
const SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-fbsvc@bisafit-bd3f5.iam.gserviceaccount.com";
const PRIVATE_KEY_ID = "f0eef176d4ec43c06a6e066a0badeec05336f7ad";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const FCM_ENDPOINT = "https://fcm.googleapis.com/v1/projects/bisafit-bd3f5/messages:send";

// PEM private key embedded
const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGEQLEO15IJT4P
/Leyc0zKYNn2NS43QEo6SXvkw8czuzuvSztyLDbQWwJo3L2dVUQzJeKZZTPZWBXl
Ry6HBbbH3BxETOMbPTRLY1hydWjIkE4sU9PMv4gvRTY70lAIaSCtN1TC854cjKhl
2zE9Eu/s4gtxwB8IUvD08VI33jWE7JwnKvse9hcGw+IFn96e+eTO72/28TyhFb7s
5elmGr2L1wL3ryKhPNXPgq9NE5XrishZ9+PlONXhmrvUAMuSeivubkmFSphVPe4s
ykPS0MkOL7m/Osprcalx+3cJXqR2RFBw9qlOTN/cnZr3FMgeTNzJEgHSwavzSH8O
ws/yi/ilAgMBAAECggEABCtMfxvuzp72EPkVVszFg4cJX3zcFa6lQVfVo0mZslWR
Go3/WNZkavtXcCShWyP11QvJmsf+EOehQlu+t3nf0JIqCCgEKckehi23qWUeSQZ8
lsNG9Irdj30p+JVjOOIZnXvKLXZaUCiHzOkRvsLcyQQzEHhmTtMMHmPMAsALKVqW
KgF4QSCCHPCPDxycB/OPQbF4u7SqyTMt3ZKRb53ZYZWwXxu8New6GUdEByjbwuy4
5Zi4PGun2Ib0N7PjBbImRCfhukWjzvSRNQYGnntlVuX60m9NHrcNriThS9GLcOVS
eeHa//zNR7epDCIsST4AjjXwRDb8it2M7xiSYuCJOwKBgQDukDCvht/bQRAVZr2A
EzyRjf9UX2+k70f1AfdbztyhCj/k8gXq7R7CVz5tBSF5CgP8PxDeGLeNvsXr3l2R
fdv7yMYHRCvPoUn03hRboryj2/chK82/CYrRVQR+lFOwDCh1nMoo0fs9lOm47nee
EHhDicUD4piYW5bI4fgPmb3pFwKBgQDUixN8Mlfh3wBZWOQy1O6Of28lrDddQ2S9
zwPkf4dp5y3nl/d4iFVfjelFQ5sX0WJ1MnLiU/6WgeHxVXeq/L1fIjJZDS8ZgMHu
bzxUSJJee+19f3QtzbA2QWs+eYavTI26gDuOJ4xRjTYbaheoie0hymPSZHf9oSQn
z+kwWb9JowKBgGoSytMBEYAXyeL6L8BGzWOa07DcTnPzwPb7zNSRgiBIwmg2BNOU
Y1zeFe+7nEqJXYRHNmTKcLMh5DcgRFJwt+OYPhT1BtXnTU8Hf93O2jmxkIy7QVx0
DblOKBVwNlXM0iCZenn0A9Y55EJKJf2uLQs6stMradY0wzLG5tlo7rw5AoGAHQ4S
ENVU/DSe+JfVQjmnjuVOzWiYfPBckjH9hzwDx+9pcBJvKxQAD7r3m5ddWUkvW3QV
DmmLEQoaWAJmBILeZGXpWhEaUjMuz6h3J9Jv5+irE4/b0vMeVpxky7qTNd2SNl+X
RJyVawSR0/eR2mFYgFkJglZnrM1dgu/CIfDy3F8CgYEA4+gMxojG8i7XJWjvdl9S
8jU0EsBvvXmnMQQUZjK+4LXaMoxa6+Tl07XqEiijqmOdNWhi8iT7JgXH7H7KxAyn
rH3luPjFF8B9CMW6shl2fP+YLnQFhcmXGDynlfgmngkqwhI5VEZPLtBSVqvaReJU
lO6l4TKsvNAJkCJTWy9yymU=
-----END PRIVATE KEY-----`;

function base64url(data: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...data));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function strToBase64url(str: string): string {
  const encoder = new TextEncoder();
  return base64url(encoder.encode(str));
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function createJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT", kid: PRIVATE_KEY_ID };
  const payload = {
    iss: SERVICE_ACCOUNT_EMAIL,
    sub: SERVICE_ACCOUNT_EMAIL,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const headerB64 = strToBase64url(JSON.stringify(header));
  const payloadB64 = strToBase64url(JSON.stringify(payload));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(PRIVATE_KEY_PEM);
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(signingInput)
  );

  const sigB64 = base64url(new Uint8Array(signature));
  return `${signingInput}.${sigB64}`;
}

async function getAccessToken(): Promise<string> {
  const jwt = await createJWT();
  const resp = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await resp.json();
  if (!data.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { device_token, title, body, data, image_url } = await req.json();

    if (!device_token || !title || !body) {
      return new Response(
        JSON.stringify({ success: false, error: "device_token, title, and body are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken();

    const message: Record<string, unknown> = {
      token: device_token,
      notification: {
        title,
        body,
        ...(image_url ? { image: image_url } : {}),
      },
      ...(data ? { data } : {}),
    };

    const fcmResp = await fetch(FCM_ENDPOINT, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const result = await fcmResp.json();

    if (!fcmResp.ok) {
      return new Response(
        JSON.stringify({ success: false, status: fcmResp.status, result }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, status: fcmResp.status, result }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
