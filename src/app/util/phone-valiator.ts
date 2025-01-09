import { AbstractControl } from "@angular/forms";
import { PhoneNumberUtil } from "google-libphonenumber";

export function phoneValidator(codeControlName = 'code', numberControlName = 'number') {
  return (group: AbstractControl) => {
    try {
      const codeControl = group.get(codeControlName);
      const numberControl = group.get(numberControlName);
      if (codeControl?.value && !numberControl?.value) return null;
      else if (!codeControl?.value || !numberControl?.value) return { phoneInvalid: true };
      const phoneUtil = PhoneNumberUtil.getInstance();
      const parsed = phoneUtil.parseAndKeepRawInput(numberControl.value, codeControl.value);
      return phoneUtil.isValidNumberForRegion(parsed, codeControl.value) ? null : { phoneInvalid: true };
    } catch (e) {
      return { phoneInvalid: true };
    }
  }
}
