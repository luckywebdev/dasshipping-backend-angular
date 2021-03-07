import * as sha1 from 'sha1';

export function GeneratePasswordHash(password: string): string {
    return sha1('secret_prefix' + password);
}
export function getHash(field: string): string {
    return sha1(field);
}
