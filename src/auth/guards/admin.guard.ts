import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Request } from "express";





@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        // Get the current HTTP request
        const request = 
            context.switchToHttp()
            .getRequest<Request>();
        
        // Read the authenticated user
        const user = request.user as {
            userId: string,
            role: string
        };

        // Reject the request if not admin
        if(user?.role !== 'admin'){
            throw new ForbiddenException(
                'Admin access required'
            )
        }

        return true;
    }
}