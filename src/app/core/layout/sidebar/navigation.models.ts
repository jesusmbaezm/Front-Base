export interface NavView {
  label: string;
  route: string;
  permission: string;
  exact?: boolean;
  icon?: string;
}

export interface NavModule {
  label: string;
  icon: string;
  permission: string | string[];
  children: NavView[];
  forceGroup?: boolean;
}