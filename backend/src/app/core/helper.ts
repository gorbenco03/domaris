import { randomBytes } from 'crypto'

export const genHex = (len = 16) => randomBytes(len).toString('hex');
export const getJti = (rtoken) => rtoken.slice(2, 13);
export const extractHeaderToken = (req) => req.headers['authorization']?.split(' ')?.at(1)?.trim() || '';
