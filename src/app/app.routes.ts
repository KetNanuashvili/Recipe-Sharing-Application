import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page';
import { EditRecipe } from './edit-recipe/edit-recipe';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'recipes/:id', loadComponent: () => import('./detail-page/detale-page').then(m => m.DetailPage) },

  { path: 'add', loadComponent: () =>
      import('./add-recipe/add-recipe').then(m => m.AddRecipeComponent)
  },

  { path: 'recipes/:id/edit', component: EditRecipe },

  { path: '**', redirectTo: '' }, 
];
