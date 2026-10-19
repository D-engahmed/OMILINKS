/**
 * Boundary between "who are you?" (an external identity provider) and
 * "what may you do?" (OmniLinks authorization). The application never trusts
 * an email taken from a request body: it only uses the email the provider
 * returns as verified.
 */
export interface IdentityProof {
  /** Email claimed by the client. Providers decide whether to use it. */
  email: string
  /** Provider-specific credential (password, OIDC id token, magic-link code). */
  credential: string | null
}

export interface IdentityProvider {
  readonly name: string
  /** Returns the verified identity, or null when the proof is not valid. */
  verify(proof: IdentityProof): Promise<{ email: string } | null>
}

/**
 * Development-only provider: trusts the claimed email, so it is NOT
 * authentication. It refuses to construct in production so a deployment cannot
 * silently run without a real provider.
 */
export class DevIdentityProvider implements IdentityProvider {
  readonly name = "dev"

  constructor(environment: string) {
    if (environment === "production") {
      throw new Error(
        "The dev identity provider cannot run in production. Configure a real identity provider."
      )
    }
  }

  async verify(proof: IdentityProof): Promise<{ email: string } | null> {
    return { email: proof.email }
  }
}
