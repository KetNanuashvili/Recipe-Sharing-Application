import {
  Component, OnInit, inject, signal, computed,
  HostListener, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.model';
import { DetailView } from '../detail-view/detail-view';



type SortKey = 'new' | 'title' | 'fav';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DetailView],
  templateUrl: './home-page.html',
  styleUrls: ['./home-page.css'],
})
export class HomePageComponent implements OnInit {
  private service = inject(RecipeService);

  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(false);

  query = signal<string>('');
  onlyFavorites = signal<boolean>(false);
  sortBy = signal<SortKey>('new');

  placeholder = 'https://picsum.photos/seed/placeholder/640/400';
  skeletons = Array.from({ length: 8 });

  private debounce!: ReturnType<typeof setTimeout>;

  @ViewChild('searchBox') searchBoxRef?: ElementRef<HTMLInputElement>;

  ngOnInit(): void {
    this.refresh();
  }

  // Quick focus on search with "/"
  @HostListener('document:keydown', ['$event'])
  onDocKey(e: KeyboardEvent) {
    if (e.key === '/' && !this.isTypingInInput(e)) {
      e.preventDefault();
      this.searchBoxRef?.nativeElement?.focus();
    }
  }
  private isTypingInInput(e: KeyboardEvent) {
    const t = e.target as HTMLElement | null;
    return !!t && ['INPUT', 'TEXTAREA'].includes(t.tagName);
  }

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
    this.searchBoxRef?.nativeElement?.focus();
  }

  refresh() {
    this.loading.set(true);
    this.service.getAll({
      q: this.query() || undefined,
      favorite: this.onlyFavorites(),
    }).subscribe({
      next: (list) => this.recipes.set(list ?? []),
      error: () => this.recipes.set([]),
      complete: () => this.loading.set(false),
    });
  }

  toggleFavorite(r: Recipe) {
    if (!r.id) return;
    this.service.update(r.id, { isFavorite: !r.isFavorite }).subscribe((updated) => {
      this.recipes.update((arr) => arr.map((x) => (x.id === updated.id ? updated : x)));
    });
  }

  onImgError(ev: Event) {
    const el = ev.target as HTMLImageElement;
    el.src = this.placeholder;
  }

  trackById = (_: number, r: Recipe) => r.id;

  // Local sort
  filtered = computed(() => {
    const list = [...this.recipes()];
    const key = this.sortBy();

    switch (key) {
      case 'title':
        list.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''));
        break;
      case 'fav':
        list.sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));
        break;
      case 'new':
      default:
        list.sort((a: any, b: any) => {
          const ta = a?.createdAt ? +new Date(a.createdAt) : 0;
          const tb = b?.createdAt ? +new Date(b.createdAt) : 0;
          return tb - ta;
        });
        break;
    }
    return list;
  });

  showModal = false;
  activeId: number | string | null = null;

  openDetails(id: number | string) {
    this.activeId = id;
    this.showModal = true;
    document.body.style.overflow = 'hidden'; 
  }

  closeModal() {
    this.showModal = false;
    this.activeId = null;
    document.body.style.overflow = ''; 
  }

 
  @HostListener('document:keydown.escape')
  onEsc() { if (this.showModal) this.closeModal(); }
}
