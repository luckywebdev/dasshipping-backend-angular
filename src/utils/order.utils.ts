export function ObjectEqual(a: any = true, b: any = true): boolean {
    if (!a || !b) {
        return false;
    }

    if (a === b) {
        return true;
    }
    // Create arrays of property names
    delete a.createdAt;
    delete a.updatedAt;
    delete b.createdAt;
    delete b.updatedAt;
    const aProps = Object.getOwnPropertyNames(a);
    const bProps = Object.getOwnPropertyNames(b);

    // If number of properties is different,
    // objects are not equivalent
    if (aProps.length !== bProps.length) {
        return false;
    }

    for (let i = 0; i < aProps.length; i++) {
        const propName = aProps[i];
        // If values of same property are not equal,
        // objects are not equivalent
        if (a[propName] !== b[propName]) {
            return false;
        }
    }

    // If we made it this far, objects
    // are considered equivalent
    return true;
}

export function PropsChanged(props: string[] = [], a: any = true, b: any = true): boolean {

    if (a === b) {
        return false;
    }

    for (let i = 0; i < props.length; i++) {
        const propName = props[i];
        if (a[propName] !== b[propName]) {
            return true;
        }
    }

    return false;
}
