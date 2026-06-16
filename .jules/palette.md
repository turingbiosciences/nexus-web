
## 2024-06-16 - Label to Input Associations
**Learning:** Proper label-to-input association using `htmlFor` on `<label>` elements and `id` on `<input>`/`<textarea>` elements is critical for screen readers to correctly identify form fields and for keyboard navigability. Many dialog forms were missing this linking.
**Action:** When creating or modifying forms, always ensure that each `<label>` has an `htmlFor` attribute that exactly matches the `id` of its corresponding input element. Add visual required indicators (`*`) to the label when the input has the `required` attribute.
