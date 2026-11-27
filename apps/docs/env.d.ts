declare module "*.css" {
  export const styles: Record<string, string>;
}

declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
