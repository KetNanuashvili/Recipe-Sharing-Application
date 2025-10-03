import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page';

export const routes: Routes = [
  { path: '', component: HomePageComponent },

  // Add (lazy-loaded standalone component)
  { path: 'add', loadComponent: () =>
      import('./add-recipe/add-recipe').then(m => m.AddRecipeComponent)
  },

  // detail გვერდი მერე ჩასვამ: { path: 'recipes/:id', loadComponent: ... }

  // MUST be last
  { path: '**', redirectTo: '' },
];
