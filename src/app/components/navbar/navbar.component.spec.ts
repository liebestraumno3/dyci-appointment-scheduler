import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('toggles mobile navigation drawer on click', async () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('#mobile-nav')).toBeNull();

    const toggleBtn = compiled.querySelector('.mobile-toggle') as HTMLButtonElement;
    toggleBtn.click();
    await fixture.whenStable();

    expect(compiled.querySelector('#mobile-nav')).not.toBeNull();
    expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');
  });
});
