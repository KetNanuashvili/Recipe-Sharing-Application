import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  FormArray,
  FormControl,
  FormGroup,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.model';

import { PopUp } from '../shared/pop-up/pop-up';

type Difficulty = '' | 'Easy' | 'Medium' | 'Hard';

interface RecipeForm {
  title: FormControl<string>;
  description: FormControl<string>;
  ingredients: FormArray<FormControl<string>>;
  instructions: FormControl<string>;
  thumbnail: FormControl<string>;
  timeMinutes: FormControl<number | null>;
  servings: FormControl<number | null>;
  difficulty: FormControl<Difficulty>;
  rating: FormControl<number>;
  tags: FormArray<FormControl<string>>;
  isFavorite: FormControl<boolean>;
  authorName: FormControl<string>;
  authorAvatar: FormControl<string>;
}

@Component({
  selector: 'app-add-recipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PopUp],
  templateUrl: './add-recipe.html',
  styleUrls: ['./add-recipe.css'],
})
export class AddRecipeComponent {
  private fb = inject(NonNullableFormBuilder);
  private service = inject(RecipeService);
  private router = inject(Router);

  hoveredRating = 0;
  thumbPreview: string | null = null;

  // PopUps
  showSavePop = false;
  showInvalidPop = false;
  showCancelPop = false;

  // for invalid popup message
  missingFields: string[] = [];

  form: FormGroup<RecipeForm> = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required, Validators.minLength(3)] }),
    description: this.fb.control('', { validators: [Validators.required, Validators.minLength(10)] }),
    ingredients: this.fb.array<FormControl<string>>([], { validators: [Validators.minLength(1)] }),
    instructions: this.fb.control('', { validators: [Validators.required, Validators.minLength(15)] }),
    thumbnail: this.fb.control(''),
    timeMinutes: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    servings: this.fb.control<number | null>(null, { validators: [Validators.min(1)] }),
    difficulty: this.fb.control<Difficulty>(''),
    rating: this.fb.control(0, { validators: [Validators.min(0), Validators.max(5)] }),
    tags: this.fb.array<FormControl<string>>([]),
    isFavorite: this.fb.control(false),
    authorName: this.fb.control(''),
    authorAvatar: this.fb.control(''),
  });

  // getters
  get ingredientsArr() { return this.form.controls.ingredients; }
  get tagsArr() { return this.form.controls.tags; }
  get ratingCtrl() { return this.form.controls.rating; }
  get thumbnailCtrl() { return this.form.controls.thumbnail; }

  fieldInvalid<K extends keyof RecipeForm>(name: K): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  // chips
  addFromInput(ev: Event, which: 'ingredients' | 'tags') {
    const input = ev.target as HTMLInputElement;
    const raw = (input.value || '').trim();
    if (!raw) return;
    const arr = which === 'ingredients' ? this.ingredientsArr : this.tagsArr;
    if (!arr.value.some(v => v.toLowerCase() === raw.toLowerCase())) {
      arr.push(this.fb.control<string>(raw));
      arr.markAsTouched();
    }
    input.value = '';
  }
  removeChip(which: 'ingredients' | 'tags', index: number) {
    const arr = which === 'ingredients' ? this.ingredientsArr : this.tagsArr;
    arr.removeAt(index);
    arr.markAsTouched();
  }

  // stars
  setRating(n: number) { this.ratingCtrl.setValue(n); this.ratingCtrl.markAsTouched(); }
  hoverRating(n: number) { this.hoveredRating = n; }

  // upload
  onDragOver(e: DragEvent) { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('dragover'); }
  onDrop(e: DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('dragover');
    const file = e.dataTransfer?.files?.[0];
    if (file) this.readFile(file);
  }
  onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files && input.files[0];
    if (file) this.readFile(file);
  }
  private readFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = (reader.result as string) || '';
      this.thumbPreview = dataUrl;
      this.thumbnailCtrl.setValue(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  // ---------- VALIDATION / POPUPS ----------

  /** required fields ok? */
  private requiredOk(): boolean {
    return (
      this.form.controls.title.valid &&
      this.form.controls.description.valid &&
      this.form.controls.instructions.valid &&
      this.ingredientsArr.length > 0
    );
  }

  private collectMissingRequired(): string[] {
    const out: string[] = [];
    if (this.form.controls.title.invalid) out.push('Title');
    if (this.form.controls.description.invalid) out.push('Description');
    if (this.ingredientsArr.length === 0) out.push('Ingredients');
    if (this.form.controls.instructions.invalid) out.push('Instructions');
    return out;
    // სურვილისამებრ აქ დაამატებ კიდევ სხვა ველებს
  }

  /** Form submit (Enter ან Save) -> ვაჩვენებთ შესაბამის PopUp-ს */
  trySubmit() {
    this.form.markAllAsTouched();
    if (!this.requiredOk()) {
      this.missingFields = this.collectMissingRequired();
      this.showInvalidPop = true;
      return;
    }
    this.showSavePop = true;
  }

  onInvalidClose() { this.showInvalidPop = false; }

  onSaveCancel() { this.showSavePop = false; }
  onSaveConfirm() {
    this.showSavePop = false;
    this.submit(); // რეალური შენახვა
  }

  /** Cancel action -> confirm clear all */
  tryCancel() {
    if (this.form.pristine && this.ingredientsArr.length === 0 && this.tagsArr.length === 0) {
      this.router.navigate(['/']);
      return;
    }
    this.showCancelPop = true;
  }
  onCancelFlowCancel() { this.showCancelPop = false; }
  onCancelFlowConfirm() {
    this.showCancelPop = false;
    this.resetFormCompletely();
    this.router.navigate(['/']);
  }

  private resetFormCompletely() {
    // clear arrays
    this.ingredientsArr.clear();
    this.tagsArr.clear();
    // reset scalars
    this.form.reset({
      title: '',
      description: '',
      instructions: '',
      thumbnail: '',
      timeMinutes: null,
      servings: null,
      difficulty: '',
      rating: 0,
      isFavorite: false,
      authorName: '',
      authorAvatar: '',
    });
    this.thumbPreview = null;
    this.form.markAsPristine();
  }

  // ---------- REAL SUBMIT ----------
  private submit() {
    const v = this.form.getRawValue();

    const payload: Partial<Recipe> & { ingredients: string[]; instructions: string } = {
      title: v.title,
      description: v.description,
      ingredients: this.ingredientsArr.value,
      instructions: v.instructions,
      thumbnail: this.thumbnailCtrl.value || this.thumbPreview || '',
      isFavorite: v.isFavorite,
      createdAt: new Date().toISOString(),
      timeMinutes: v.timeMinutes ?? undefined,
      servings: v.servings ?? undefined,
      difficulty: v.difficulty || undefined,
      rating: v.rating ?? 0,
      tags: this.tagsArr.value,
      author: v.authorName ? { name: v.authorName, avatar: v.authorAvatar || undefined } : undefined,
    };

    this.service.create(payload as Recipe).subscribe({
      next: (created) => {
        // დაბრუნება მთავარზე და გახსნა მოდალად
        this.router.navigate(['/'], { queryParams: { recipe: created.id } });
      },
      error: () => alert('Failed to create recipe. Please try again.'),
    });
  }
}
