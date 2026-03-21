export interface AdminNavigationChildItem {
  id: string;
  label: string;
}

export interface AdminNavigationItem {
  id: string;
  label: string;
  copy: string;
  badge?: string | null;
  defaultChildId?: string;
  children?: AdminNavigationChildItem[];
}
