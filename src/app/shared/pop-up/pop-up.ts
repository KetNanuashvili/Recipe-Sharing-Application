

import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

export type PopUpMode = 'confirm' | 'save' | 'delete';

@Component({
  selector: 'app-pop-up',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pop-up.html',
  styleUrl: './pop-up.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PopUp  implements OnChanges {
  @Input() open = false;
  @Input() mode: PopUpMode = 'confirm';
  @Input() title = '';
  @Input() message = '';
  @Input() confirmText = '';
  @Input() cancelText = '';
  @Input() backdropClose = true;
  @Input() width = 440;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('confirmBtn') confirmBtn!: ElementRef<HTMLButtonElement>;

  ngOnChanges(ch: SimpleChanges): void {
    if (ch['open']?.currentValue === true) {
      queueMicrotask(() => this.confirmBtn?.nativeElement?.focus());
      document.body.style.overflow = 'hidden';
    }
    if (ch['open']?.currentValue === false) {
      document.body.style.overflow = '';
    }
  }

  get defaultTitle(): string {
    switch (this.mode) {
      case 'delete': return 'წაშლა?';
      case 'save':   return 'შენახვა?';
      default:       return 'დადასტურება';
    }
  }
  get defaultMessage(): string {
    switch (this.mode) {
      case 'delete': return 'ნამდვილად გსურს ჩანაწერის წაშლა? ეს ქმედება შეუქცევადია.';
      case 'save':   return 'შენახოთ ცვლილებები?';
      default:       return 'დარწმუნებული ხარ ამ ქმედებაში?';
    }
  }
  get defaultConfirm(): string {
    switch (this.mode) {
      case 'delete': return 'დიახ, წაშალე';
      case 'save':   return 'დიახ, შეინახე';
      default:       return 'დადასტურება';
    }
  }

  onBackdropClick() {
    if (this.backdropClose) this.onCancel();
  }

  onConfirm() { this.confirm.emit(); }
  onCancel()  { this.cancel.emit(); }

 
  @HostListener('document:keydown', ['$event'])
  handleDocKey(ev: Event) {
    if (!this.open) return;

 
    const e = ev as KeyboardEvent;
    const key = (e && 'key' in e) ? e.key : '';

    if (key === 'Escape') {
      e.preventDefault?.();
      this.onCancel();
    } else if (key === 'Enter') {
      e.preventDefault?.();
      this.onConfirm();
    }
  }
}
