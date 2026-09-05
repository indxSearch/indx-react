declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// Plain CSS side-effect imports (e.g. import './globals/globals.css').
declare module '*.css';

interface ImportMetaEnv {
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
