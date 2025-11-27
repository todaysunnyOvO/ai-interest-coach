/// <reference types='@modern-js/app-tools/types' />
/// <reference types='@modern-js/runtime/types' />
/// <reference types='@modern-js/runtime/types/router' />
declare module '@modern-js/plugin-express/server' {
  import { Request, Response, NextFunction } from 'express';
  export function useContext(): {
    req: Request;
    res: Response;
    next: NextFunction;
  };
}
