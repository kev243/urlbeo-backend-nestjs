import { PipeTransform, Injectable } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class SanitizeHtmlPipe implements PipeTransform {
  transform(value: unknown) {
    return this.sanitizeDeep(value);
  }

  private sanitizeDeep(value: unknown): unknown {
    if (typeof value === 'string') return sanitizeHtml(value);
    if (Array.isArray(value)) return value.map((v) => this.sanitizeDeep(v));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([k, v]) => [
          k,
          this.sanitizeDeep(v),
        ]),
      );
    }
    return value;
  }
}
