export function stringToBoolean(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    return value === 'true' ? true : (value === 'false' ? false : undefined);
}
