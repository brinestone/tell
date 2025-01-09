import { computed, Directive, HostListener, input } from '@angular/core';
import { AsYouTypeFormatter } from 'google-libphonenumber';

@Directive({
  selector: '[tmPhone]'
})
export class PhoneDirective {
  readonly code = input<string>();
  private formatter = computed(() => new AsYouTypeFormatter(this.code() ?? 'CM'));

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    const target = event.target as HTMLInputElement;
    let result = '';
    if (event.inputType == 'deleteContentBackward' || event.inputType == 'deleteContentForward') {
      this.formatter().clear();
      const sample = target.value.replaceAll(/[^0-9]+/g, '');
      for (const char of sample) {
        result = this.formatter().inputDigit(char);
      }
    } else if (event.inputType == 'insertText') {
      result = this.formatter().inputDigit(event.data as string);
    }
    target.value = result;
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key != 'Delete' && event.key != 'Backspace' && !/[0-9]/.test(event.key) && event.key != 'Tab' && event.key != 'Shift' && event.key != 'End' && event.key != 'Home' && event.key != 'Alt') {
      event.preventDefault();
      return;
    }
  }
}
