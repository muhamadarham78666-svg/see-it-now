/**
 * Thin compatibility layer that maps the react-router-dom API surface used by
 * the app onto TanStack Router primitives.
 */
import { useCallback, useMemo, type ReactNode } from "react";
import {
  Link as TsLink,
  Outlet,
  useNavigate as useTsNavigate,
  useRouterState,
} from "@tanstack/react-router";

export { Outlet };

export function useLocation() {
  const location = useRouterState({ select: (s) => s.location });
  return location;
}

export function useNavigate() {
  const navigate = useTsNavigate();
  return useCallback(
    (to: string | number, options?: { replace?: boolean }) => {
      if (typeof to === "number") {
        if (typeof window !== "undefined") window.history.go(to);
        return;
      }
      navigate({ to, replace: options?.replace, ignoreBlocker: true } as never);
    },
    [navigate],
  );
}

export function useSearchParams(): [URLSearchParams, (next: URLSearchParams) => void] {
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useTsNavigate();
  const params = useMemo(() => new URLSearchParams(searchStr ?? ""), [searchStr]);
  const setParams = useCallback(
    (next: URLSearchParams) => {
      const qs = next.toString();
      navigate({ to: qs ? `${pathname}?${qs}` : pathname } as never);
    },
    [navigate, pathname],
  );
  return [params, setParams];
}

type LinkProps = {
  to: string;
  children?: ReactNode;
  className?: string;
  replace?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: unknown;
};

export function Link({ to, children, ...rest }: LinkProps) {
  return (
    <TsLink to={to} {...(rest as Record<string, unknown>)}>
      {children}
    </TsLink>
  );
}

type NavLinkProps = Omit<LinkProps, "className" | "children"> & {
  end?: boolean;
  className?: string | ((state: { isActive: boolean }) => string);
  children?: ReactNode | ((state: { isActive: boolean }) => ReactNode);
};

export function NavLink({ to, end, className, children, ...rest }: NavLinkProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = end
    ? pathname === to
    : pathname === to || pathname.startsWith(`${to}/`);
  const resolvedClass = typeof className === "function" ? className({ isActive }) : className;
  const resolvedChildren = typeof children === "function" ? children({ isActive }) : children;

  return (
    <TsLink {...(rest as Record<string, unknown>)} to={to} className={resolvedClass}>
      {resolvedChildren}
    </TsLink>
  );
}

export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);
  return null;
}
