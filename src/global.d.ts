declare module "*.css";
declare module "expo-mlkit-ocr" {
  export interface TextBlock {
    text: string;
    lines: { text: string }[];
  }
  export function recognizeText(
    uri: string,
  ): Promise<{ blocks: TextBlock[] }>;
}
