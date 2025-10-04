import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormArray, FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RecipeService } from '../services/recipe.service';
import { Recipe } from '../models/recipe.model';

@Component({
  selector: 'app-edit-recipe',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-recipe.html',
  styleUrls: ['./edit-recipe.css'] // <- FIX: styleUrls
})
export class EditRecipe implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private service = inject(RecipeService);
  private router = inject(Router);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>; // <- FIX: for clearPhoto()

  id!: number | string;
  loading = true;
  thumbPreview: string | null = null;

  form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    ingredients: this.fb.nonNullable.array<FormControl<string>>([], [Validators.minLength(1)]),
    instructions: ['', [Validators.required, Validators.minLength(15)]],
    thumbnail: [''],
    timeMinutes: this.fb.control<number | null>(null, [Validators.min(1)]),
    servings: this.fb.control<number | null>(null, [Validators.min(1)]),
    difficulty: this.fb.control<'Easy' | 'Medium' | 'Hard' | ''>(''),
    rating: this.fb.control<number | null>(null, [Validators.min(0), Validators.max(5)]),
    tags: this.fb.nonNullable.array<FormControl<string>>([]),
    isFavorite: this.fb.nonNullable.control<boolean>(false),
    authorName: [''],
    authorAvatar: [''],
  });

  get ingredientsArr(): FormArray<FormControl<string>> {
    return this.form.get('ingredients') as FormArray<FormControl<string>>;
  }
  get tagsArr(): FormArray<FormControl<string>> {
    return this.form.get('tags') as FormArray<FormControl<string>>;
  }

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.service.getById(this.id).subscribe({
      next: (r) => this.fillForm(r),
      error: () => {
        alert('Recipe not found');
        this.router.navigate(['/']);
      },
      complete: () => (this.loading = false),
    });
  }

  private fillForm(r: Recipe) {
    this.ingredientsArr.clear();
    (r.ingredients ?? []).forEach(v => this.ingredientsArr.push(this.fb.nonNullable.control(v)));
    this.tagsArr.clear();
    (r.tags ?? []).forEach(v => this.tagsArr.push(this.fb.nonNullable.control(v)));

    this.form.patchValue({
      title: r.title ?? '',
      description: r.description ?? '',
      instructions: r.instructions ?? '',
      thumbnail: r.thumbnail ?? '',
      timeMinutes: r.timeMinutes ?? null,
      servings: r.servings ?? null,
      difficulty: (r.difficulty as any) ?? '',
      rating: r.rating ?? null,
      isFavorite: !!r.isFavorite,
      authorName: r.author?.name ?? '',
      authorAvatar: r.author?.avatar ?? '',
    });

    this.thumbPreview = r.thumbnail || null;
  }

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

  onThumbUrlBlur(ev: Event) {
    const el = ev.target as HTMLInputElement;
    const url = el.value?.trim();
    this.thumbPreview = url || null;
  }

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

  fieldInvalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const payload: Partial<Recipe> & { ingredients: string[]; instructions: string } = {
      title: v.title,
      description: v.description,
      ingredients: this.ingredientsArr.value,
      instructions: v.instructions,
      thumbnail: v.thumbnail || this.thumbPreview || '',
      isFavorite: !!v.isFavorite,
      timeMinutes: v.timeMinutes ?? undefined,
      servings: v.servings ?? undefined,
      difficulty: (v.difficulty || undefined) as any,
      rating: v.rating ?? 0,
      tags: this.tagsArr.value,
      author: v.authorName ? { name: v.authorName, avatar: v.authorAvatar || undefined } : undefined,
    };

    this.service.update(this.id, payload).subscribe({
      next: () => this.router.navigate(['/']),
      error: () => alert('Failed to save changes. Please try again.'),
    });
  }

  clearPhoto() {
    this.thumbPreview = null;
    this.form.patchValue({ thumbnail: '' });
    const el = this.fileInput?.nativeElement;
    if (el) el.value = ''; 
  }
}
