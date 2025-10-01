import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  // later: { path: 'recipes/:id', loadComponent: ... }
  // later: { path: 'add', loadComponent: ... }
  { path: '**', redirectTo: '' },
];
