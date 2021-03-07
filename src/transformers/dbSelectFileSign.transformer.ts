import { fileSign } from '../utils/fileSign.util';

export const dbSelectFileSign = {
    from: (value) => fileSign(value),
    to: (value) => value,
};
