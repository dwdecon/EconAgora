export type CloudBaseAuthLike = {
  getVerification(params: { email: string; target?: string }): Promise<{
    verification_id?: string;
    is_user?: boolean;
  }>;
  verify(params: { verification_id?: string; verification_code: string }): Promise<{
    verification_token?: string;
  }>;
  resetPassword(params: {
    email: string;
    new_password: string;
    verification_token: string;
  }): Promise<unknown>;
  signInWithPassword(params: { email: string; password: string }): Promise<AuthResult>;
  signOut?: () => Promise<unknown>;
  oauthInstance?: {
    authApi?: {
      signUp(params: {
        email: string;
        username: string;
        password: string;
        name: string;
        nickname: string;
        verification_code: string;
        verification_token: string;
      }): Promise<unknown>;
    };
  };
};

export type AuthResult<TData = unknown> = {
  data?: TData;
  error?: { message?: string } | null;
};

export type RegistrationDraft = {
  email: string;
  password: string;
  displayName: string;
  verificationId?: string;
  isExistingUser: boolean;
};

export type RegistrationInput = {
  email: string;
  password: string;
  displayName: string;
};

export type RegistrationCompleteResult = {
  signInResult: AuthResult;
};

export function isPasswordMissingError(message = "") {
  const normalized = message.toLowerCase();
  return message.includes("账号密码未设置") || normalized.includes("password not set");
}

export async function startEmailPasswordRegistration(
  auth: CloudBaseAuthLike,
  input: RegistrationInput,
): Promise<RegistrationDraft> {
  const email = input.email.trim();
  const displayName = input.displayName.trim();

  const verification = await auth.getVerification({ email, target: "ANY" });

  return {
    email,
    password: input.password,
    displayName,
    verificationId: verification.verification_id,
    isExistingUser: Boolean(verification.is_user),
  };
}

export async function completeEmailPasswordRegistration(
  auth: CloudBaseAuthLike,
  draft: RegistrationDraft,
  verificationCode: string,
): Promise<RegistrationCompleteResult> {
  const token = verificationCode.trim();
  const verification = await auth.verify({
    verification_id: draft.verificationId,
    verification_code: token,
  });

  if (!verification.verification_token) {
    throw new Error("Verification did not return a token.");
  }

  if (draft.isExistingUser) {
    await auth.resetPassword({
      email: draft.email,
      new_password: draft.password,
      verification_token: verification.verification_token,
    });
  } else {
    const authApi = auth.oauthInstance?.authApi;
    if (!authApi?.signUp) {
      throw new Error("CloudBase direct email sign-up API is unavailable.");
    }

    await authApi.signUp({
      email: draft.email,
      username: draft.email,
      password: draft.password,
      name: draft.displayName,
      nickname: draft.displayName,
      verification_code: token,
      verification_token: verification.verification_token,
    });
  }

  await auth.signOut?.();

  const signInResult = await auth.signInWithPassword({
    email: draft.email,
    password: draft.password,
  });

  if (signInResult.error) {
    throw new Error(signInResult.error.message || "Password sign-in failed.");
  }

  return { signInResult };
}
