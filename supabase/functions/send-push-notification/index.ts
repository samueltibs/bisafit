// send-push-notification Edge Function
// Deno/Supabase Edge Function for sending FCM v1 push notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PROJECT_ID = "bisafit-bd3f5";
const SERVICE_ACCOUNT_EMAIL = "firebase-adminsdk-fbsvc@bisafit-bd3f5.iam.gserviceaccount.com";
const PRIVATE_KEY_ID = "f0eef176d4ec43c06a6e066a0badeec05336f7ad";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const FCM_ENDPOINT = "https://fcm.googleapis.com/v1/projects/bisafit-bd3f5/messages:send";

// PEM private key loaded from Supabase environment secret
const PRIVATE_KEY_PEM = (Deno.env.get("FIREBASE_PRIVATE_KEY_PEM") ?? "").replace(/\\n/g, "\n");

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
