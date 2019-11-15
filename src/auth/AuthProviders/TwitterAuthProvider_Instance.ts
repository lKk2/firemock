import { AuthProvider } from "@firebase/auth-types";

// tslint:disable-next-line: class-name
export class TwitterAuthProvider_Instance implements AuthProvider {
  public providerId: string;
  public addScope(scope: string): AuthProvider {
    throw new Error("TwitterAuthProvider not implemented yet");
  }

  // tslint:disable-next-line: ban-types
  public setCustomParameters(customOAuthParameters: Object): AuthProvider {
    throw new Error("TwitterAuthProvider not implemented yet");
  }
}