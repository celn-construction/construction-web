"use client";

import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { getBaseURL } from "./utils/getBaseURL";

export const authClient = createAuthClient({
  baseURL: `${getBaseURL()}/api/auth`,
  plugins: [emailOTPClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
