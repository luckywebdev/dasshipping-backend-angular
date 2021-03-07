
export function transformFileUrl(url: string): string {
    if (url) {
        return url.split('/').pop().split('?')[0];
    }
    return url;
}
