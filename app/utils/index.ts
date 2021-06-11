import { JsonObject } from 'type-fest';

export class Util {
    public static async delay<T extends { cancel: () => void }>(
        ms: number,
      ): Promise<T> {
        let ctr;
        let rej;
        const p = new Promise<any>((resolve, reject) => {
          ctr = setTimeout(resolve, ms);
          rej = reject;
        });
        Object.defineProperty(p, 'cancel', {
          value: () => {
            clearTimeout(ctr);
            rej(Error('Cancelled'));
          },
          writable: true,
          enumerable: true,
          configurable: false,
        });
        return p;
      }

    public static isJsonParsable(str: string): boolean {
        try {
          JSON.parse(str);
        } catch (e) {
          return false;
        }
        return true;
      }

    public static dtoToJson(obj: any): JsonObject {
        return JSON.parse(JSON.stringify(obj));
      }
}