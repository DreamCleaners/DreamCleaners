import { IMetadataObject } from './metadataObject';
import { MetadataOptions } from './metadataOptions';

export class MetadataFactory {
  public static createMetadataObject<T>(
    object: T,
    options: MetadataOptions,
  ): IMetadataObject<T> {
    return {
      object: object,
      isDamageable: options.isDamageable ?? false,
      isInteractive: options.isInteractive ?? false,
    };
  }
}
