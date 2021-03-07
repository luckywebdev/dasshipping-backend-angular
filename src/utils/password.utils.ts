const standartRegEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/g;
const strongRegEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{12,})/g;

export function ValidateStandartPassword(password: string): boolean {
    return standartRegEx.test(password);
}

export function ValidateStrongPassword(password: string): boolean {
    return strongRegEx.test(password);
}
