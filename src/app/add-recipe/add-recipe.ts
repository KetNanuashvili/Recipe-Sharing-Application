import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormArray,
  FormControl
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.model';

@Component({
  selector: 'app-add-recipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './add-recipe.html',
  styleUrls: ['./add-recipe.css'],
})
export class AddRecipeComponent {
  private fb = inject(FormBuilder);
  private service = inject(RecipeService);
  private router = inject(Router);

  // Thumbnail preview (from URL or uploaded file)
  thumbPreview: string | null = null;

  // Reactive form
  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    // FormArray<string> with at least one item
    ingredients: this.fb.nonNullable.array<FormControl<string>>([], [Validators.minLength(1)]),
    instructions: ['', [Validators.required, Validators.minLength(15)]],
    thumbnail: [''], // optional; we also use thumbPreview
    timeMinutes: this.fb.control<number | null>(null, [Validators.min(1)]),
    servings: this.fb.control<number | null>(null, [Validators.min(1)]),
    difficulty: this.fb.control<'Easy' | 'Medium' | 'Hard' | ''>(''),
    rating: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(5)]),
    tags: this.fb.nonNullable.array<FormControl<string>>([]),
    isFavorite: this.fb.nonNullable.control<boolean>(false),
    authorName: [''],
    authorAvatar: [''],
  });

  // Convenient getters for template
  get ingredientsArr(): FormArray<FormControl<string>> {
    return this.form.get('ingredients') as FormArray<FormControl<string>>;
  }
  get tagsArr(): FormArray<FormControl<string>> {
    return this.form.get('tags') as FormArray<FormControl<string>>;
  }

  /** Add chip from input (Enter or blur). Avoid duplicates (ci). */
  addFromInput(ev: Event, which: 'ingredients' | 'tags') {
    const input = ev.target as HTMLInputElement;
    const raw = (input.value || '').trim();
    if (!raw) return;

    const arr = which === 'ingredients' ? this.ingredientsArr : this.tagsArr;
    const exists = arr.value.some(v => v.toLowerCase() === raw.toLowerCase());
    if (!exists) {
      arr.push(this.fb.nonNullable.control<string>(raw));
      if (which === 'ingredients') this.ingredientsArr.markAsTouched();
    }
    input.value = '';
  }

  removeChip(which: 'ingredients' | 'tags', index: number) {
    const arr = which === 'ingredients' ? this.ingredientsArr : this.tagsArr;
    arr.removeAt(index);
    if (which === 'ingredients') this.ingredientsArr.markAsTouched();
  }

  /** If user typed an image URL, set preview on blur */
  onThumbUrlBlur(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const url = el.value?.trim();
    this.thumbPreview = url || null;
  }

  /** File input -> dataURL preview */
  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.thumbPreview = String(reader.result || '');
      this.form.patchValue({ thumbnail: this.thumbPreview });
    };
    reader.readAsDataURL(file);
  }

  /** Drag & drop upload */
  onDrop(ev: DragEvent) {
    ev.preventDefault();
    const file = ev.dataTransfer?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.thumbPreview = String(reader.result || '');
      this.form.patchValue({ thumbnail: this.thumbPreview });
    };
    reader.readAsDataURL(file);
  }
  onDragOver(ev: DragEvent) { ev.preventDefault(); }

  /** Show error state only when touched/dirty */
  fieldInvalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  /** Submit to json-server, then navigate to detail page */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();

    const payload: Partial<Recipe> & {
      ingredients: string[];
      instructions: string;
    } = {
      title: v.title,
      description: v.description,
      ingredients: this.ingredientsArr.value,
      instructions: v.instructions,
      thumbnail: v.thumbnail || this.thumbPreview || '',
      isFavorite: !!v.isFavorite,
      createdAt: new Date().toISOString(),
      timeMinutes: v.timeMinutes ?? undefined,
      servings: v.servings ?? undefined,
      difficulty: (v.difficulty || undefined) as any,
      rating: v.rating ?? 0,
      tags: this.tagsArr.value,
      author: v.authorName ? { name: v.authorName, avatar: v.authorAvatar || undefined } : undefined,
    };

    this.service.create(payload as Recipe).subscribe({
      next: (created) => {
        // redirect to detail (make sure you have this route)
        this.router.navigate(['/recipes', created.id]);
      },
      error: () => alert('Failed to create recipe. Please try again.'),
    });
  }
}
