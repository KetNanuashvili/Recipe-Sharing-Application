
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DetailView } from '../detail-view/detail-view';

@Component({
  standalone: true,
  selector: 'app-detail-page',
  imports: [CommonModule, RouterModule, DetailView],
  template: `
    <main class="container">
      <app-detail-view
        [id]="id"
        (closed)="goBack()">
      </app-detail-view>
    </main>
  `,
})
export class DetailPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  id = this.route.snapshot.paramMap.get('id')!;
  goBack() { this.router.navigate(['/']); }
}
