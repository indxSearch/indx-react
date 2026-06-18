declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Plain CSS side-effect imports (e.g. import './globals/globals.css').
declare module '*.css';

// Build-time env guard used in dev-only warnings. Vite's `define` inlines
// process.env.NODE_ENV at build; this declaration just satisfies the dts typecheck
// without pulling in @types/node.
declare const process: {
  env: {
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
};