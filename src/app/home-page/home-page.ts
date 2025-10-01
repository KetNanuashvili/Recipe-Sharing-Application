import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service'; 
import { Recipe } from '../models/recipe.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css'],
})
export class HomePageComponent implements OnInit {
  private service = inject(RecipeService);

  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(false);

  query = signal<string>('');
  onlyFavorites = signal<boolean>(false);

  private debounce!: ReturnType<typeof setTimeout>;
  placeholder = 'https://picsum.photos/seed/placeholder/640/400';

  ngOnInit(): void { this.refresh(); }

  debouncedRefresh(value?: string) {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      if (value !== undefined) this.query.set(value.trim());
      this.refresh();
    }, 250);
  }

  clearSearch() {
    this.query.set('');
    this.refresh();
  }

  refresh() {
    this.loading.set(true);
    this.service.getAll({
      q: this.query() || undefined,
      favorite: this.onlyFavorites(),
    }).subscribe({
      next: (list) => this.recipes.set(list),
      error: () => this.recipes.set([]),
      complete: () => this.loading.set(false),
    });
  }

  toggleFavorite(r: Recipe) {
    if (!r.id) return;
    this.service.update(r.id, { isFavorite: !r.isFavorite }).subscribe((updated) => {
      this.recipes.update(arr => arr.map(x => x.id === updated.id ? updated : x));
    });
  }

  trackById = (_: number, r: Recipe) => r.id;
  filtered = computed(() => this.recipes());
}
