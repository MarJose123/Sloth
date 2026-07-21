/*
 * Copyright (C) 2026
 *
 * Owner: MarJose123 (https://github.com/MarJose123/sloth)
 * Project: Sloth
 * License: GPLv3 <https://choosealicense.com/licenses/gpl-3.0/>
 *
 * Everyone is permitted to copy and distribute verbatim copies
 *  of this license document, but changing it is not allowed.
 */

declare module "*.css";
declare module "expo-mlkit-ocr" {
  export interface TextBlock {
    text: string;
    lines: { text: string }[];
  }
  export function recognizeText(uri: string): Promise<{ blocks: TextBlock[] }>;
}
