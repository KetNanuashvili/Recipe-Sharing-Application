import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Recipe } from '../models/recipe.model';


@Injectable({ providedIn: 'root' })
export class RecipeService {
private http = inject(HttpClient);
private baseUrl = 'http://localhost:3000/recipes';


getAll(options?: { q?: string; favorite?: boolean; page?: number; limit?: number }): Observable<Recipe[]> {
let params = new HttpParams();
if (options?.q) {
params = params
.set('title_like', options.q)
.set('ingredients_like', options.q);
}
if (options?.favorite) params = params.set('isFavorite', true);
if (options?.page) params = params.set('_page', options.page);
if (options?.limit) params = params.set('_limit', options.limit);


return this.http.get<Recipe[]>(this.baseUrl, { params });
}


getById(id: number): Observable<Recipe> {
return this.http.get<Recipe>(`${this.baseUrl}/${id}`);
}


create(payload: Recipe): Observable<Recipe> {
return this.http.post<Recipe>(this.baseUrl, payload);
}


update(id: number, payload: Partial<Recipe>): Observable<Recipe> {
return this.http.patch<Recipe>(`${this.baseUrl}/${id}`, payload);
}


delete(id: number): Observable<void> {
return this.http.delete<void>(`${this.baseUrl}/${id}`);
}
}