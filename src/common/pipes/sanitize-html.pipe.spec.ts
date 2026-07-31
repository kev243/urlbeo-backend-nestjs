import { SanitizeHtmlPipe } from './sanitize-html.pipe';

describe('SanitizeHtmlPipe', () => {
  let pipe: SanitizeHtmlPipe;

  beforeEach(() => {
    pipe = new SanitizeHtmlPipe();
  });

  it('removes HTML tags from strings', () => {
    expect(
      pipe.transform('<strong>Hello</strong> <script>alert(1)</script>'),
    ).toBe('Hello ');
  });

  it('sanitizes nested object values', () => {
    expect(
      pipe.transform({
        title: '<img src=x onerror=alert(1)>Portfolio',
        links: ['<a href="https://example.com">Example</a>'],
      }),
    ).toEqual({
      title: 'Portfolio',
      links: ['Example'],
    });
  });
});
