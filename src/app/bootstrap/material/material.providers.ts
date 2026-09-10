// src/app/bootstrap/material/material.providers.ts
import { Provider } from '@angular/core';
import { materialDefaults } from './material-defaults';

export const materialProviders: Provider[] = [
  ...materialDefaults
];