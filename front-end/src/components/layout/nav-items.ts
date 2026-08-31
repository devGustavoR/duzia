import {
  LayoutDashboard,
  CreditCard,
  RefreshCw,
  Target,
  Bell,
  LogOut,
  Receipt,
  Calculator,
  HelpCircle,
  FileCheck,
  GraduationCap,
  Dumbbell,
  Bus,
  Server,
  Landmark,
  CalendarHeart,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  name: string;
  /** Short label for the bottom tab bar */
  short?: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { name: 'Dashboard', short: 'Início', href: '/', icon: LayoutDashboard },
  { name: 'Cartões de Crédito', short: 'Cartões', href: '/cartoes-credito', icon: CreditCard },
  { name: 'Cartões de Passagem', short: 'Passagem', href: '/cartoes', icon: Bus },
  { name: 'Contas', short: 'Contas', href: '/contas', icon: FileCheck },
  { name: 'Contas Pagas', short: 'Pagas', href: '/pagos', icon: FileCheck },
  { name: 'Servidores & Cloud', short: 'Servidores', href: '/servidores', icon: Server },
  { name: 'Assinaturas', short: 'Assinaturas', href: '/assinaturas', icon: RefreshCw },
  { name: 'Academia & Saúde', short: 'Academia', href: '/academia', icon: Dumbbell },
  { name: 'Faculdade', short: 'Faculdade', href: '/faculdade', icon: GraduationCap },
  { name: 'Dívidas', short: 'Dívidas', href: '/dividas', icon: Receipt },
  { name: 'Pix Parcelado', short: 'Pix Parc.', href: '/pix-parcelado', icon: Landmark },
  { name: 'Preparação p/ o Dia', short: 'Eventos', href: '/eventos', icon: CalendarHeart },
  { name: 'Simulador', short: 'Simulador', href: '/simulador', icon: Calculator },
  { name: 'Metas', short: 'Metas', href: '/metas', icon: Target },
  { name: 'Avisos WhatsApp', short: 'Avisos', href: '/avisos', icon: Bell },
  { name: 'Quiz Renda', short: 'Quiz', href: '/onboarding', icon: HelpCircle },
];

/** hrefs shown as fixed tabs in the mobile bottom bar (4 max, 5th slot = "Mais") */
export const mobilePrimaryHrefs = ['/', '/contas', '/cartoes-credito'];

export const logoutIcon = LogOut;

/** Resolve the screen title for the mobile app bar from a pathname */
export function titleForPath(pathname: string): string {
  if (pathname === '/') return 'Início';
  const hit = navItems.find(
    (i) => i.href !== '/' && (pathname === i.href || pathname.startsWith(i.href + '/')),
  );
  return hit?.name ?? 'Duzia';
}
