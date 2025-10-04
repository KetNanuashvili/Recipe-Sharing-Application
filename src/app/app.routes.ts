import { Routes } from '@angular/router';
import { HomePageComponent } from './home-page/home-page';

export const routes: Routes = [
  { path: '', component: HomePageComponent },

  // { path: 'recipes/:id', loadComponent: () =>
  //     import('./detail-page/detaილ-page').then(m => m.DetailPage)
  // },

  { path: 'add', loadComponent: () =>
      import('./add-recipe/add-recipe').then(m => m.AddRecipeComponent)
  },

  { path: 'recipes/:id/edit', loadComponent: () =>
      import('./edit-recipe/edit-recipe').then(m => m.EditRecipe)
  },

  { path: '**', loadComponent: () =>
      import('./shared/not-found/not-found').then(m => m.NotFound)
  },
];








































































































































