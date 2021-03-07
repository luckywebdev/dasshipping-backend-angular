import * as randomstring from 'randomstring';

export function RandomString(length: number = 36): string {
   return randomstring.generate(length);
}
