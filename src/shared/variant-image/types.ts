export type OptionSnapshot = { dimension: string; value: string };

export type ImageSignature = {
  imageId: number;
  imageKey: string;
  signatures: Record<string, string>;
};
