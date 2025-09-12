import { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

export interface JWTPayload {
  userId: string;
  orgId: string;
  role: string;
}

export async function authenticate(request: FastifyRequest): Promise<JWTPayload> {
  const token = request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('No token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as JWTPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: FastifyRequest) => {
    const payload = await authenticate(request);
    
    if (!allowedRoles.includes(payload.role)) {
      throw new Error('Insufficient permissions');
    }
    
    return payload;
  };
}