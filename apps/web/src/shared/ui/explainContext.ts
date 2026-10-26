import { createContext } from 'react';

export const ExplainContext = createContext<readonly string[] | null>(null);
