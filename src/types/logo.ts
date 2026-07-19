/** Logo/image resolution types. */

export interface LogoSource {
  type: "bundled" | "uri";
  source?: ReturnType<typeof require>;
  uri?: string;
}
