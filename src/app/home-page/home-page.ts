import {
  Component, OnInit, inject, signal, computed,
  HostListener, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
showModal = false;
  activeId: number | string | null = null;
  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(false);

  query = signal<string>('');          
  onlyFavorites = signal<boolean>(false);
  sortBy = signal<SortKey>('new');

  placeholder = 'https://picsum.photos/seed/placeholder/640/400';
  private debounce!: ReturnType<typeof setTimeout>;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  @ViewChild('searchBox') searchBoxRef?: ElementRef<HTMLInputElement>;

   ngOnInit(): void {
    this.refresh();

   
    this.route.queryParamMap.subscribe((qp) => {
      const id = qp.get('recipe');
      if (id) {
        this.activeId = id;
        this.showModal = true;
        document.body.style.overflow = 'hidden';
      } else {
        this.showModal = false;
        this.activeId = null;
        document.body.style.overflow = '';
      }
    });
  }

  // დოკუმენტზე "/" – ფოკუსი საძიებოზე
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

  // 🔎 debounce — ლოკალურად ფილტრავს, სერვერზე აღარ გავდივართ
  debouncedRefresh(value?: string) {
    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => {
      if (value !== undefined) this.query.set(value.trim());
      // ❌ refresh() აღარ გვჭირდება ყოველ ინპუტზე — ფილტრაცია computed()-შია
    }, 250);
  }

  clearSearch() {
    this.query.set('');
    // refresh() არაა საჭირო — computed დაგვიფილტრავს
    this.searchBoxRef?.nativeElement?.focus();
  }

  // 📥 ერთხელ იტვირთე სია (სერვერიდან) და მერე ლოკალურად იმუშავე
  refresh() {
    this.loading.set(true);
    this.service.getAll().subscribe({
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

  // ✅ კომპოზიტური ფილტრაცია + სორტი (ყველაფერი ლოკალურად)
  filtered = computed(() => {
    let list = [...this.recipes()];
    const q = this.query().toLowerCase();

    if (q) {
      list = list.filter(r => {
        const title = (r.title || '').toLowerCase();
        const desc  = (r.description || '').toLowerCase();
        const tags  = (r.tags || []).join(' ').toLowerCase();
        const ings  = (r.ingredients || []).join(' ').toLowerCase();
        return title.includes(q) || desc.includes(q) || tags.includes(q) || ings.includes(q);
      });
    }

    if (this.onlyFavorites()) {
      list = list.filter(r => !!r.isFavorite);
    }

    // სორტი
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




openDetails(id: number | string) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { recipe: id },
      queryParamsHandling: 'merge', // სხვა qp არ წაიშალოს
    });
  }

  closeModal() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { recipe: null },
      queryParamsHandling: 'merge',
    });
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.showModal) this.closeModal(); }

  onDeleted(id: number | string) {
    this.recipes.update(arr => arr.filter(r => r.id !== id));
    this.closeModal();
  }

}