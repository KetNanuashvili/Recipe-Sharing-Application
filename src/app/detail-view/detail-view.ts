// detail-view.ts
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Recipe } from '../models/recipe.model';
import { RecipeService } from '../services/recipe.service';
import { Router } from '@angular/router';
import { PopUp } from '../shared/pop-up/pop-up';



type ParsedIngredient = { qty?: string; unit?: string; name: string; raw: string };

@Component({
  selector: 'app-detail-view',
  standalone: true,
  imports: [CommonModule, PopUp ],
  templateUrl: './detail-view.html',
  styleUrls: ['./detail-view.css'],
})
export class DetailView implements OnInit {
  @Input({ required: true }) id!: number | string;
  @Output() closed = new EventEmitter<void>();
  @Output() deleted = new EventEmitter<number | string>();  
  private router = inject(Router);
  private service = inject(RecipeService);
  recipe: Recipe | null = null;
  loading = true;
  deleting = false;                                   
  placeholder = 'https://picsum.photos/seed/placeholder/640/400';

  showPop = false;

  ngOnInit(): void {
    this.service.getById(this.id).subscribe({
      next: (r) => (this.recipe = r),
      error: () => (this.recipe = null),
      complete: () => (this.loading = false),
    });
  }

  get parsedIngredients(): ParsedIngredient[] {
    const list = this.recipe?.ingredients ?? [];
    return list.map((ing) => this.parseIngredient(ing));
  }

  private parseIngredient(ing: string): ParsedIngredient {
    const raw = (ing ?? '').trim();
    if (!raw) return { raw, name: '' };
    const rx = /^\s*([\d.,\/½⅓¼¾⅔⅛⅜⅝⅞]+)?\s*([^\s\d]+)?\s*(.*)$/i;
    const m = raw.match(rx);
    if (!m) return { raw, name: raw };
    const qty  = (m[1] || '').trim() || undefined;
    const unit = (m[2] || '').trim() || undefined;
    const name = (m[3] || '').trim() || raw;
    return { raw, qty, unit, name };
  }

  onEdit() {
    const id = this.id ?? this.recipe?.id;
    if (!id) return;
    this.closed.emit(); 
    queueMicrotask(() => this.router.navigate(['/recipes', id, 'edit']));
  }


    confirmDelete() {
    this.showPop = true;
  }

  onPopupCancel() { this.showPop = false; }

  onPopupConfirm() {
  
    const id = this.id ?? this.recipe?.id;
    if (!id) return;
    this.deleting = true;
    this.service.delete(id).subscribe({
      next: () => {
        this.deleting = false;
        this.showPop = false;
        this.deleted.emit(id);
        this.closed.emit();
      },
      error: () => {
        this.deleting = false;
        this.showPop = false;
        alert('Failed to delete. Please try again.');
      },
    });
  }
}
